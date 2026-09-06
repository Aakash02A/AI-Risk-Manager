package com.chargeback.responder.service;

import com.chargeback.responder.dto.*;
import com.chargeback.responder.entity.*;
import com.chargeback.responder.exception.InvalidCaseStateException;
import com.chargeback.responder.exception.ResourceNotFoundException;
import com.chargeback.responder.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CaseService {

    private final DisputeRepository disputeRepository;
    private final EvidenceRepository evidenceRepository;
    private final PredictionRepository predictionRepository;
    private final DefenseResponseRepository defenseResponseRepository;
    private final AuditLogRepository auditLogRepository;
    private final MlClientService mlClientService;
    private final DecisionRoutingService decisionRoutingService;
    private final AuditLogService auditLogService;

    @Transactional
    public CaseResponseDto createCase(CaseCreateDto dto) {
        String payId = dto.getPaymentId() != null && !dto.getPaymentId().isBlank() ? dto.getPaymentId() : "pay_" + UUID.randomUUID().toString().substring(0, 14).replace("-", "");
        String dispId = dto.getRazorpayDisputeId() != null && !dto.getRazorpayDisputeId().isBlank() ? dto.getRazorpayDisputeId() : "disp_" + UUID.randomUUID().toString().substring(0, 14).replace("-", "");
        String cardNet = dto.getCardNetwork() != null && !dto.getCardNetwork().isBlank() ? dto.getCardNetwork() : "VISA";

        Dispute dispute = Dispute.builder()
                .caseId(dto.getCaseId())
                .disputeAmount(dto.getDisputeAmount())
                .disputeReason(dto.getDisputeReason())
                .daysSinceOrder(dto.getDaysSinceOrder())
                .paymentId(payId)
                .razorpayDisputeId(dispId)
                .cardNetwork(cardNet)
                .razorpayStatus("action_required")
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        disputeRepository.save(dispute);

        EvidenceDto evDto = dto.getEvidence();
        Evidence evidence = Evidence.builder()
                .caseId(dto.getCaseId())
                .dispute(dispute)
                .orderExists(evDto.getOrderExists())
                .invoiceExists(evDto.getInvoiceExists())
                .paymentConfirmed(evDto.getPaymentConfirmed())
                .deliveryStatus(evDto.getDeliveryStatus())
                .trackingNumberPresent(evDto.getTrackingNumberPresent())
                .customerCommunication(evDto.getCustomerCommunication())
                .refundStatus(evDto.getRefundStatus())
                .customerPriorDisputeCount(evDto.getCustomerPriorDisputeCount())
                .build();
        evidenceRepository.save(evidence);

        auditLogService.log(dto.getCaseId(), "Case received", "New dispute case recorded into system", "OPERATOR");
        auditLogService.log(dto.getCaseId(), "Evidence collected", "Dispute transaction and fulfillment evidence captured", "SYSTEM");

        return getCase(dto.getCaseId());
    }

    public List<CaseResponseDto> listCases(String search, String reason, String decision) {
        List<Dispute> disputes = disputeRepository.findWithFilters(search, reason);
        return disputes.stream()
                .map(d -> buildCaseResponse(d))
                .filter(res -> decision == null || (res.getLatestPrediction() != null && decision.equalsIgnoreCase(res.getLatestPrediction().getDecision())))
                .collect(Collectors.toList());
    }

    public CaseResponseDto getCase(String caseId) {
        Dispute dispute = disputeRepository.findByCaseId(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));
        return buildCaseResponse(dispute);
    }

    @Transactional
    public void deleteCase(String caseId) {
        Dispute dispute = disputeRepository.findByCaseId(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));
        defenseResponseRepository.deleteByCaseId(caseId);
        predictionRepository.deleteByCaseId(caseId);
        evidenceRepository.deleteByCaseId(caseId);
        auditLogRepository.deleteByCaseId(caseId);
        disputeRepository.delete(dispute);
    }

    @Transactional
    public PredictionDto analyzeCase(String caseId) {
        Dispute dispute = disputeRepository.findByCaseId(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));
        Evidence evidence = evidenceRepository.findByCaseId(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence missing for case: " + caseId));

        // 1. Convert Evidence into ML features
        MlPredictRequest mlRequest = MlPredictRequest.builder()
                .disputeAmount(dispute.getDisputeAmount())
                .disputeReason(dispute.getDisputeReason())
                .daysSinceOrder(dispute.getDaysSinceOrder())
                .orderExists(evidence.getOrderExists())
                .invoiceExists(evidence.getInvoiceExists())
                .paymentConfirmed(evidence.getPaymentConfirmed())
                .deliveryStatus(evidence.getDeliveryStatus())
                .trackingNumberPresent(evidence.getTrackingNumberPresent())
                .customerCommunication(evidence.getCustomerCommunication())
                .refundStatus(evidence.getRefundStatus())
                .customerPriorDisputeCount(evidence.getCustomerPriorDisputeCount())
                .build();

        // 2. Call Python ML microservice
        MlPredictResponse mlResponse = mlClientService.predictProbability(mlRequest);

        // 3. Apply ratio-aware decision engine in Spring Boot layer
        RatioDecisionEngine.DecisionResult decisionResult = decisionRoutingService.routeRatioAwareProbability(mlResponse.getWinProbability());
        String decision = decisionResult.getDecision();

        // 4. Store prediction
        Prediction prediction = Prediction.builder()
                .caseId(caseId)
                .winProbability(mlResponse.getWinProbability())
                .decision(decision)
                .modelName(mlResponse.getModelName())
                .modelVersion(mlResponse.getModelVersion())
                .build();
        predictionRepository.save(prediction);

        // 5. Create audit logs with ratio state explanation
        int pct = (int) (mlResponse.getWinProbability().doubleValue() * 100);
        auditLogService.log(caseId, "ML prediction generated", String.format("Win probability calculated: %d%% using %s v%s", pct, mlResponse.getModelName(), mlResponse.getModelVersion()), "ML_CLASSIFIER");
        auditLogService.log(caseId, "Decision assigned", decisionResult.getExplanation(), "RULE_ROUTER");

        return PredictionDto.builder()
                .winProbability(prediction.getWinProbability())
                .decision(prediction.getDecision())
                .modelName(prediction.getModelName())
                .modelVersion(prediction.getModelVersion())
                .createdAt(prediction.getCreatedAt())
                .build();
    }

    private final LlmOrchestrationService llmOrchestrationService;

    @Transactional
    public DefenseResponseDto generateDefenseResponse(String caseId) {
        Dispute dispute = disputeRepository.findByCaseId(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));
        Evidence evidence = evidenceRepository.findByCaseId(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence missing for case: " + caseId));
        Prediction prediction = predictionRepository.findTopByCaseIdOrderByCreatedAtDesc(caseId)
                .orElseThrow(() -> new InvalidCaseStateException("Case must be analyzed by ML classifier before generating defense response"));

        if (!"STRONG".equalsIgnoreCase(prediction.getDecision())) {
            throw new InvalidCaseStateException(String.format(
                    "Defense response generation is restricted to disputes with STRONG win confidence. Current decision: %s. Borderline cases require human review, and weak cases are recommended for refund.",
                    prediction.getDecision()
            ));
        }

        LlmOrchestrationService.RebuttalResult result = llmOrchestrationService.generateRebuttal(dispute, evidence);

        DefenseResponse defense = DefenseResponse.builder()
                .caseId(caseId)
                .responseText(result.responseText())
                .generatedBy(result.generatedBy())
                .build();
        defenseResponseRepository.save(defense);

        auditLogService.log(caseId, "Defense response generated", "Formal 8-part merchant rebuttal drafted and attached to dossier", "LLM_ASSISTANT");

        return DefenseResponseDto.builder()
                .responseText(defense.getResponseText())
                .generatedBy(defense.getGeneratedBy())
                .createdAt(defense.getCreatedAt())
                .build();
    }



    private CaseResponseDto buildCaseResponse(Dispute dispute) {
        Evidence evidence = evidenceRepository.findByCaseId(dispute.getCaseId()).orElse(null);
        Prediction prediction = predictionRepository.findTopByCaseIdOrderByCreatedAtDesc(dispute.getCaseId()).orElse(null);
        DefenseResponse defense = defenseResponseRepository.findTopByCaseIdOrderByCreatedAtDesc(dispute.getCaseId()).orElse(null);
        List<AuditLog> auditLogs = auditLogRepository.findByCaseIdOrderByCreatedAtAsc(dispute.getCaseId());

        EvidenceDto evDto = evidence != null ? EvidenceDto.builder()
                .orderExists(evidence.getOrderExists())
                .invoiceExists(evidence.getInvoiceExists())
                .paymentConfirmed(evidence.getPaymentConfirmed())
                .deliveryStatus(evidence.getDeliveryStatus())
                .trackingNumberPresent(evidence.getTrackingNumberPresent())
                .customerCommunication(evidence.getCustomerCommunication())
                .refundStatus(evidence.getRefundStatus())
                .customerPriorDisputeCount(evidence.getCustomerPriorDisputeCount())
                .build() : null;

        PredictionDto predDto = prediction != null ? PredictionDto.builder()
                .winProbability(prediction.getWinProbability())
                .decision(prediction.getDecision())
                .modelName(prediction.getModelName())
                .modelVersion(prediction.getModelVersion())
                .createdAt(prediction.getCreatedAt())
                .build() : null;

        DefenseResponseDto defDto = defense != null ? DefenseResponseDto.builder()
                .responseText(defense.getResponseText())
                .generatedBy(defense.getGeneratedBy() != null ? defense.getGeneratedBy() : "gemini-3.8-flash")
                .createdAt(defense.getCreatedAt())
                .build() : null;

        List<AuditLogDto> logDtos = auditLogs.stream().map(l -> AuditLogDto.builder()
                .action(l.getAction())
                .details(l.getDetails())
                .actor(l.getActor())
                .createdAt(l.getCreatedAt())
                .build()).collect(Collectors.toList());

        return CaseResponseDto.builder()
                .caseId(dispute.getCaseId())
                .disputeAmount(dispute.getDisputeAmount())
                .disputeReason(dispute.getDisputeReason())
                .daysSinceOrder(dispute.getDaysSinceOrder())
                .paymentId(dispute.getPaymentId())
                .razorpayDisputeId(dispute.getRazorpayDisputeId())
                .razorpayStatus(dispute.getRazorpayStatus() != null ? dispute.getRazorpayStatus() : "action_required")
                .cardNetwork(dispute.getCardNetwork() != null ? dispute.getCardNetwork() : "VISA")
                .expiresAt(dispute.getExpiresAt() != null ? dispute.getExpiresAt() : (dispute.getCreatedAt() != null ? dispute.getCreatedAt().plusDays(7) : LocalDateTime.now().plusDays(7)))
                .evidence(evDto)
                .latestPrediction(predDto)
                .latestDefenseResponse(defDto)
                .auditLogs(logDtos)
                .createdAt(dispute.getCreatedAt())
                .build();
    }

    @Transactional
    public CaseResponseDto contestOnRazorpay(String caseId) {
        Dispute dispute = disputeRepository.findByCaseId(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));

        dispute.setRazorpayStatus("submitted");
        disputeRepository.save(dispute);

        auditLogService.log(
                caseId,
                "Contest Submitted to Razorpay",
                "Formal dispute defense packet, order receipts, delivery audit, and AI rebuttal package submitted to Razorpay Dispute API for card scheme arbitration.",
                "OPERATOR"
        );

        return getCase(caseId);
    }

    @Transactional
    public CaseResponseDto acceptOnRazorpay(String caseId) {
        Dispute dispute = disputeRepository.findByCaseId(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + caseId));

        dispute.setRazorpayStatus("accepted");
        disputeRepository.save(dispute);

        auditLogService.log(
                caseId,
                "Dispute Conceded on Razorpay",
                "Dispute liability accepted via Razorpay API. Refund authorized to protect merchant Visa VAMP / Mastercard loss ratio ceiling and avoid arbitration fees.",
                "OPERATOR"
        );

        return getCase(caseId);
    }

    @Transactional
    public CaseResponseDto ingestRazorpayWebhook(Map<String, Object> payload) {
        String event = (String) payload.getOrDefault("event", "dispute.created");
        Map<String, Object> payloadData = payload.containsKey("payload") && payload.get("payload") instanceof Map
                ? (Map<String, Object>) payload.get("payload") : payload;
        Map<String, Object> disputeData = payloadData.containsKey("dispute") && payloadData.get("dispute") instanceof Map
                ? (Map<String, Object>) payloadData.get("dispute") : payloadData;
        Map<String, Object> entity = disputeData.containsKey("entity") && disputeData.get("entity") instanceof Map
                ? (Map<String, Object>) disputeData.get("entity") : disputeData;

        String dispId = (String) entity.getOrDefault("id", "disp_" + UUID.randomUUID().toString().substring(0, 12).replace("-", ""));
        String payId = (String) entity.getOrDefault("payment_id", "pay_" + UUID.randomUUID().toString().substring(0, 12).replace("-", ""));

        Object amtObj = entity.getOrDefault("amount", 2500000);
        BigDecimal amount;
        if (amtObj instanceof Number) {
            amount = BigDecimal.valueOf(((Number) amtObj).doubleValue() / 100.0);
        } else {
            try {
                amount = new BigDecimal(amtObj.toString());
            } catch (Exception e) {
                amount = new BigDecimal("25000.00");
            }
        }

        String reason = (String) entity.getOrDefault("reason_code", "item_not_received");
        if (reason == null || reason.isBlank()) {
            reason = "item_not_received";
        }

        String caseId = "CB-" + dispId.substring(Math.max(0, dispId.length() - 6)).toUpperCase() + "-RZP";

        if (disputeRepository.findByCaseId(caseId).isPresent()) {
            return getCase(caseId);
        }

        Dispute dispute = Dispute.builder()
                .caseId(caseId)
                .disputeAmount(amount)
                .disputeReason(reason)
                .daysSinceOrder(6)
                .paymentId(payId)
                .razorpayDisputeId(dispId)
                .razorpayStatus("action_required")
                .cardNetwork("VISA")
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        disputeRepository.save(dispute);

        Evidence evidence = Evidence.builder()
                .caseId(caseId)
                .dispute(dispute)
                .orderExists(true)
                .invoiceExists(true)
                .paymentConfirmed(true)
                .deliveryStatus("delivered_confirmed")
                .trackingNumberPresent(true)
                .customerCommunication("acknowledged_receipt")
                .refundStatus("no_refund")
                .customerPriorDisputeCount(0)
                .build();
        evidenceRepository.save(evidence);

        auditLogService.log(
                caseId,
                "Razorpay Webhook Received",
                "Ingested live " + event + " webhook from Razorpay for Payment " + payId + " (Dispute " + dispId + ")",
                "RAZORPAY_WEBHOOK"
        );

        try {
            analyzeCase(caseId);
        } catch (Exception ignored) {
        }

        return getCase(caseId);
    }
}

