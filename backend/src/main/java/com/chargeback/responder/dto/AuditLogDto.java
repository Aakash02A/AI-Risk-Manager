package com.chargeback.responder.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogDto {
    private String action;
    private String details;
    private String actor;
    private LocalDateTime createdAt;
}
