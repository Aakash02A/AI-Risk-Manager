package com.chargeback.responder.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "predictions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "case_id", nullable = false, length = 64)
    private String caseId;

    @Column(name = "win_probability", nullable = false, precision = 5, scale = 4)
    private BigDecimal winProbability;

    @Column(name = "decision", nullable = false, length = 32)
    private String decision; // 'STRONG', 'BORDERLINE', 'WEAK'

    @Column(name = "model_name", nullable = false, length = 128)
    private String modelName;

    @Column(name = "model_version", nullable = false, length = 32)
    private String modelVersion;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
