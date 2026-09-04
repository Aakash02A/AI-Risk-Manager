package com.chargeback.responder.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DefenseResponseDto {
    @JsonProperty("response_text")
    private String responseText;

    @JsonProperty("generated_by")
    private String generatedBy;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
