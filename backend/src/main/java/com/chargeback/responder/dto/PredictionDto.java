package com.chargeback.responder.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictionDto {
    private BigDecimal winProbability;
    private String decision; // 'STRONG', 'BORDERLINE', 'WEAK'
    private String modelName;
    private String modelVersion;
    private LocalDateTime createdAt;
}
