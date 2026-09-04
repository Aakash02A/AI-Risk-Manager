package com.chargeback.responder.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictionDto {
    @JsonProperty("win_probability")
    private BigDecimal winProbability;

    @JsonProperty("decision")
    private String decision; // 'STRONG', 'BORDERLINE', 'WEAK'

    @JsonProperty("model_name")
    private String modelName;

    @JsonProperty("model_version")
    private String modelVersion;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
