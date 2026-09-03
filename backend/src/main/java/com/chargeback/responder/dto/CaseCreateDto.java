package com.chargeback.responder.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseCreateDto {
    @NotBlank(message = "case_id is required")
    private String caseId;

    @NotNull(message = "dispute_amount is required")
    @DecimalMin(value = "0.01", message = "dispute_amount must be greater than 0")
    private BigDecimal disputeAmount;

    @NotBlank(message = "dispute_reason is required")
    private String disputeReason;

    @NotNull(message = "days_since_order is required")
    private Integer daysSinceOrder;

    @Valid
    @NotNull(message = "evidence is required")
    private EvidenceDto evidence;
}
