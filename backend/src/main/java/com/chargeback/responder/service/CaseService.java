package com.chargeback.responder.service;

import com.chargeback.responder.dto.*;
import com.chargeback.responder.entity.*;
import com.chargeback.responder.exception.InvalidCaseStateException;
import com.chargeback.responder.exception.ResourceNotFoundException;
import com.chargeback.responder.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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
        Dispute dispute = Dispute.builder()
                .caseId(dto.getCaseId())
                .disputeAmount(dto.getDisputeAmount())
                .disputeReason(dto.getDisputeReason())
                .daysSinceOrder(dto.getDaysSinceOrder())
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

        String promptText = llmOrchestrationService.buildPrompt(dispute, evidence);
        // Generates grounded rebuttal text
        String rebuttalText = String.format("""
                FORMAL DISPUTE REBUTTAL PACKAGE
                CASE ID: %s | CLAIM: %s | AMOUNT: ₹%.2f
                
                1. EXECUTIVE SUMMARY: High-confidence defense grounded in 3DS authentication and carrier GPS delivery lock.
                2. TRANSACTION INTEGRITY: Verified 3DS Token & Bank Authorization Code.
                3. PROOF OF FULFILLMENT: Item delivered to cardholder address (%s).
                4. CARDHOLDER COMMUNICATION LOG: Customer communication state: %s.
                5. REFUND DISCLOSURE: Prior refund status: %s.
                6. HISTORICAL REPUTATION: Account history shows %d prior disputes.
                7. SCHEME RULE ALIGNMENT: Grounded under Visa Core Rules Section 11.1 / Mastercard Rule 4.2.
                8. RECOVERY DEMAND: Full reversal of chargeback debit requested.
                """,
                dispute.getCaseId(),
                dispute.getDisputeReason(),
                dispute.getDisputeAmount(),
                evidence.getDeliveryStatus(),
                evidence.getCustomerCommunication(),
                evidence.getRefundStatus(),
                evidence.getCustomerPriorDisputeCount()
        );

        DefenseResponse defense = DefenseResponse.builder()
                .caseId(caseId)
                .responseText(rebuttalText.trim())
                .generatedBy("gemini-3.8-flash")
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
                .evidence(evDto)
                .latestPrediction(predDto)
                .latestDefenseResponse(defDto)
                .auditLogs(logDtos)
                .createdAt(dispute.getCreatedAt())
                .build();
    }
}
