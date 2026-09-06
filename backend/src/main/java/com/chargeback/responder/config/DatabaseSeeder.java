package com.chargeback.responder.config;

import com.chargeback.responder.entity.*;
import com.chargeback.responder.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Enterprise Database Seeder.
 * Guarantees that on initial startup (MySQL fresh install or H2 in-memory mode),
 * the system is pre-populated with standard risk configurations, scheme ratios,
 * and canonical enterprise dispute cases (Case A: Strong, Case B: Weak, Case C: Borderline).
 * If records already exist, seeding is skipped.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final DisputeRepository disputeRepository;
    private final EvidenceRepository evidenceRepository;
    private final PredictionRepository predictionRepository;
    private final DefenseResponseRepository defenseResponseRepository;
    private final AuditLogRepository auditLogRepository;
    private final RiskConfigRepository riskConfigRepository;
    private final DisputeRatioStateRepository disputeRatioStateRepository;

    @Override
    @Transactional
    public void run(String... args) {
        seedRiskConfig();
        seedRatioState();

        if (disputeRepository.count() == 0) {
            log.info("Database contains 0 dispute records. Executing canonical enterprise seed initialization...");
            seedCanonicalDisputes();
            log.info("Database seeding completed successfully. 12 production-grade dispute dossiers initialized.");
        } else {
            log.info("Database already initialized with {} dispute cases. Running Razorpay metadata backfill.", disputeRepository.count());
            disputeRepository.findAll().forEach(d -> {
                boolean updated = false;
                if (d.getPaymentId() == null || d.getPaymentId().isBlank()) {
                    String numericPart = d.getCaseId().replaceAll("[^0-9]", "");
                    d.setPaymentId("pay_" + (numericPart.length() >= 4 ? numericPart : "9821") + "RZP" + Math.abs(d.getCaseId().hashCode() % 1000));
                    updated = true;
                }
                if (d.getRazorpayDisputeId() == null || d.getRazorpayDisputeId().isBlank()) {
                    String numericPart = d.getCaseId().replaceAll("[^0-9]", "");
                    d.setRazorpayDisputeId("disp_" + (numericPart.length() >= 4 ? numericPart : "4310") + "DS" + Math.abs(d.getCaseId().hashCode() % 1000));
                    updated = true;
                }
                if (d.getCardNetwork() == null || d.getCardNetwork().isBlank()) {
                    d.setCardNetwork((d.getCaseId().hashCode() % 3 == 0) ? "MASTERCARD" : (d.getCaseId().hashCode() % 3 == 1) ? "RUPAY" : "VISA");
                    updated = true;
                }
                if (d.getRazorpayStatus() == null || d.getRazorpayStatus().isBlank()) {
                    d.setRazorpayStatus("action_required");
                    updated = true;
                }
                if (d.getExpiresAt() == null) {
                    d.setExpiresAt(d.getCreatedAt() != null ? d.getCreatedAt().plusDays(7) : java.time.LocalDateTime.now().plusDays(7));
                    updated = true;
                }
                if (updated) {
                    disputeRepository.save(d);
                }
            });
        }
    }


    private void seedRiskConfig() {
        if (riskConfigRepository.count() == 0) {
            RiskConfig config = new RiskConfig();
            config.setNetworkCeiling(0.015);
            config.setRepresentationFee(1500.0);
            config.setHumanReviewCost(200.0);
            config.setTrailingPeriodDays(30);
            config.setBaseStrongThreshold(0.70);
            config.setBaseWeakThreshold(0.40);
            config.setTCap(0.95);
            config.setAlpha(0.20);
            riskConfigRepository.save(config);
            log.info("Initialized default Risk Policy Configuration (Ceiling: 1.50%, T_base: 0.70).");
        }
    }

    private void seedRatioState() {
        if (disputeRatioStateRepository.count() == 0) {
            DisputeRatioState state = new DisputeRatioState();
            state.setPeriodDays(30);
            state.setDisputesCount(1000);
            state.setDisputesLostCount(9);
            state.setDisputesWonCount(91);
            state.setDisputesFoughtCount(100);
            state.setLossRatio(0.009);
            disputeRatioStateRepository.save(state);
            log.info("Initialized default Card Scheme Dispute Ratio State (Loss Ratio: 0.90%).");
        }
    }

    private void seedCanonicalDisputes() {
        LocalDateTime now = LocalDateTime.now();

        // 1. CB-8942-IN (Case A - Strong)
        createCaseDossier("CB-8942-IN", new BigDecimal("145000.00"), "unauthorized_transaction", 3,
                true, true, true, "delivered_confirmed", true, "acknowledged_receipt", "no_refund", 0,
                new BigDecimal("0.9600"), "STRONG",
                "High-value chargeback notice received from Visa Acquirer (Ref: TXN-8942-0192)",
                "3D-Secure 2.0 authentication liability shift verified with HDFC acquiring bank payload",
                "Predicted win confidence: 96% -> STRONG Zone (Auto-Respond Authorized)",
                now.minusMinutes(4));

        // 2. CB-7819-IN (Case A - Strong)
        createCaseDossier("CB-7819-IN", new BigDecimal("54200.00"), "item_not_received", 7,
                true, true, true, "delivered_confirmed", true, "acknowledged_receipt", "no_refund", 0,
                new BigDecimal("0.9400"), "STRONG",
                "Item Not Received dispute initiated by cardholder (Order #ORD-IN-2026-7819)",
                "FedEx Express tracking (FX-78192019-IN) verified with signed proof of delivery photo",
                "Predicted win confidence: 94% -> STRONG Zone (Auto-Respond Authorized)",
                now.minusMinutes(12));

        // 3. CB-6120-IN (Case C - Borderline)
        createCaseDossier("CB-6120-IN", new BigDecimal("18900.00"), "not_as_described", 14,
                true, true, true, "delivered_unconfirmed", true, "complained_before", "no_refund", 1,
                new BigDecimal("0.5800"), "BORDERLINE",
                "Merchandise quality dispute filed via Mastercard gateway",
                "Customer email thread attached showing merchant offered 15% discount credit",
                "Predicted win confidence: 58% -> BORDERLINE Zone (Human Review Required)",
                now.minusMinutes(25));

        // 4. CB-5431-IN (Strong)
        createCaseDossier("CB-5431-IN", new BigDecimal("89500.00"), "duplicate_charge", 21,
                true, true, true, "delivered_confirmed", true, "acknowledged_receipt", "no_refund", 0,
                new BigDecimal("0.8500"), "STRONG",
                "Subscription renewal charge dispute filed by cardholder",
                "Annual SaaS contract digital agreement timestamp & IP match verified",
                "Predicted win confidence: 85% -> STRONG Zone",
                now.minusMinutes(42));

        // 5. CB-4310-IN (Borderline)
        createCaseDossier("CB-4310-IN", new BigDecimal("12800.00"), "not_as_described", 10,
                true, true, true, "delivered_unconfirmed", true, "complained_before", "partial_refund", 1,
                new BigDecimal("0.4600"), "BORDERLINE",
                "Return processing delay inquiry raised by cardholder bank",
                "Warehouse scan verified item arrived with partial physical damage",
                "Predicted win confidence: 46% -> BORDERLINE Zone (Human Review Required)",
                now.minusHours(1));

        // 6. CB-3291-IN (Case B - Weak)
        createCaseDossier("CB-3291-IN", new BigDecimal("9450.00"), "item_not_received", 28,
                true, true, true, "unknown", false, "no_contact", "no_refund", 3,
                new BigDecimal("0.1400"), "WEAK",
                "Item not received claim escalated by cardholder",
                "Courier reported parcel lost in transit without final delivery scan",
                "Predicted win confidence: 14% -> WEAK Zone (Recommend Refund)",
                now.minusHours(2));

        // 7. CB-2104-IN (Strong)
        createCaseDossier("CB-2104-IN", new BigDecimal("210000.00"), "unauthorized_transaction", 2,
                true, true, true, "delivered_confirmed", true, "acknowledged_receipt", "no_refund", 0,
                new BigDecimal("0.9800"), "STRONG",
                "High-value luxury goods chargeback received from issuer",
                "Biometric 3DS Step-Up authentication token validated by card network",
                "Predicted win confidence: 98% -> STRONG Zone (Auto-Respond Authorized)",
                now.minusHours(3));

        // 8. CB-1982-IN (Strong)
        createCaseDossier("CB-1982-IN", new BigDecimal("32000.00"), "not_as_described", 6,
                true, true, true, "delivered_confirmed", true, "acknowledged_receipt", "no_refund", 0,
                new BigDecimal("0.8900"), "STRONG",
                "Claim of mismatched electronic specifications received",
                "Manufacturer product serial number cross-referenced with order invoice",
                "Predicted win confidence: 89% -> STRONG Zone",
                now.minusHours(5));

        // 9. CB-1540-IN (Case B - Weak)
        createCaseDossier("CB-1540-IN", new BigDecimal("14999.00"), "unauthorized_transaction", 25,
                true, false, false, "unknown", false, "no_contact", "no_refund", 4,
                new BigDecimal("0.2200"), "WEAK",
                "Chargeback filed without 3DS liability shift protection",
                "No tax invoice or valid delivery tracking recorded in OMS",
                "Predicted win confidence: 22% -> WEAK Zone (Recommend Refund)",
                now.minusHours(8));

        // 10. CB-1205-IN (Strong)
        createCaseDossier("CB-1205-IN", new BigDecimal("78000.00"), "duplicate_charge", 15,
                true, true, true, "delivered_confirmed", true, "acknowledged_receipt", "no_refund", 0,
                new BigDecimal("0.8100"), "STRONG",
                "Duplicate billing claim filed on annual contract renewal",
                "Single transaction settlement ID verified on payment processor ledger",
                "Predicted win confidence: 81% -> STRONG Zone",
                now.minusHours(12));

        // 11. CB-1102-IN (Strong)
        createCaseDossier("CB-1102-IN", new BigDecimal("45500.00"), "not_as_described", 11,
                true, true, true, "delivered_confirmed", true, "acknowledged_receipt", "no_refund", 0,
                new BigDecimal("0.8700"), "STRONG",
                "Product variance claim filed with Axis Bank issuer",
                "Signed delivery acknowledgement form retrieved from Blue Dart carrier",
                "Predicted win confidence: 87% -> STRONG Zone",
                now.minusHours(14));

        // 12. CB-1050-IN (Borderline)
        createCaseDossier("CB-1050-IN", new BigDecimal("22400.00"), "item_not_received", 19,
                true, true, true, "delivered_unconfirmed", true, "complained_before", "no_refund", 1,
                new BigDecimal("0.5200"), "BORDERLINE",
                "Delivery dispute filed by buyer after requesting delivery address modification",
                "Carrier GPS timestamp indicates neighborhood delivery without OTP signoff",
                "Predicted win confidence: 52% -> BORDERLINE Zone (Human Review Required)",
                now.minusHours(16));
    }

    private void createCaseDossier(
            String caseId, BigDecimal amount, String reason, int daysSinceOrder,
            boolean orderExists, boolean invoiceExists, boolean paymentConfirmed,
            String deliveryStatus, boolean trackingNumberPresent, String customerComm,
            String refundStatus, int priorDisputes, BigDecimal winProb, String decision,
            String log1, String log2, String log3, LocalDateTime timestamp
    ) {
        String numericPart = caseId.replaceAll("[^0-9]", "");
        String payId = "pay_" + (numericPart.length() >= 4 ? numericPart : "9821") + "RZP" + Math.abs(caseId.hashCode() % 1000);
        String dispId = "disp_" + (numericPart.length() >= 4 ? numericPart : "4310") + "DS" + Math.abs(caseId.hashCode() % 1000);
        String cardNet = (caseId.hashCode() % 3 == 0) ? "MASTERCARD" : (caseId.hashCode() % 3 == 1) ? "RUPAY" : "VISA";
        String rzpStatus = "STRONG".equalsIgnoreCase(decision) ? "action_required" : "action_required";

        Dispute dispute = Dispute.builder()
                .caseId(caseId)
                .disputeAmount(amount)
                .disputeReason(reason)
                .daysSinceOrder(daysSinceOrder)
                .paymentId(payId)
                .razorpayDisputeId(dispId)
                .cardNetwork(cardNet)
                .razorpayStatus(rzpStatus)
                .expiresAt(timestamp.plusDays(7))
                .createdAt(timestamp)
                .updatedAt(timestamp)
                .build();
        disputeRepository.save(dispute);

        Evidence evidence = Evidence.builder()
                .caseId(caseId)
                .dispute(dispute)
                .orderExists(orderExists)
                .invoiceExists(invoiceExists)
                .paymentConfirmed(paymentConfirmed)
                .deliveryStatus(deliveryStatus)
                .trackingNumberPresent(trackingNumberPresent)
                .customerCommunication(customerComm)
                .refundStatus(refundStatus)
                .customerPriorDisputeCount(priorDisputes)
                .createdAt(timestamp)
                .build();
        evidenceRepository.save(evidence);

        Prediction prediction = Prediction.builder()
                .caseId(caseId)
                .winProbability(winProb)
                .decision(decision)
                .modelName("RandomForestClassifier")
                .modelVersion("1.0")
                .createdAt(timestamp.plusSeconds(30))
                .build();
        predictionRepository.save(prediction);

        auditLogRepository.save(AuditLog.builder()
                .caseId(caseId)
                .action("Case Received")
                .details(log1)
                .actor("OPERATOR")
                .createdAt(timestamp)
                .build());

        auditLogRepository.save(AuditLog.builder()
                .caseId(caseId)
                .action("Evidence Collected")
                .details(log2)
                .actor("SYSTEM")
                .createdAt(timestamp.plusSeconds(15))
                .build());

        auditLogRepository.save(AuditLog.builder()
                .caseId(caseId)
                .action("ML Analysis")
                .details(log3)
                .actor("ML_CLASSIFIER")
                .createdAt(timestamp.plusSeconds(30))
                .build());
    }
}
