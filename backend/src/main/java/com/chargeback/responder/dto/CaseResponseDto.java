package com.chargeback.responder.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseResponseDto {
    @JsonProperty("case_id")
    private String caseId;

    @JsonProperty("dispute_amount")
    private BigDecimal disputeAmount;

    @JsonProperty("dispute_reason")
    private String disputeReason;

    @JsonProperty("days_since_order")
    private Integer daysSinceOrder;

    @JsonProperty("evidence")
    private EvidenceDto evidence;

    @JsonProperty("prediction")
    private PredictionDto latestPrediction;

    @JsonProperty("defense_response")
    private DefenseResponseDto latestDefenseResponse;

    @JsonProperty("audit_logs")
    private List<AuditLogDto> auditLogs;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
