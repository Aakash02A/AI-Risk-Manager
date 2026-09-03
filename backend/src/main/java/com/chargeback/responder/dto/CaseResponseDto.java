package com.chargeback.responder.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseResponseDto {
    private String caseId;
    private BigDecimal disputeAmount;
    private String disputeReason;
    private Integer daysSinceOrder;
    private EvidenceDto evidence;
    private PredictionDto latestPrediction;
    private String latestDefenseResponse;
    private List<AuditLogDto> auditLogs;
    private LocalDateTime createdAt;
}
