package com.chargeback.responder.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "risk_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "network_ceiling", nullable = false)
    @Builder.Default
    private Double networkCeiling = 0.015; // 1.5% Visa VAMP threshold

    @Column(name = "representation_fee", nullable = false)
    @Builder.Default
    private Double representationFee = 1500.0; // ₹1,500 Visa/Mastercard acquirer fee

    @Column(name = "human_review_cost", nullable = false)
    @Builder.Default
    private Double humanReviewCost = 200.0; // ₹200 operational triage cost

    @Column(name = "trailing_period_days", nullable = false)
    @Builder.Default
    private Integer trailingPeriodDays = 30;

    @Column(name = "base_strong_threshold", nullable = false)
    @Builder.Default
    private Double baseStrongThreshold = 0.80; // Derived from test set 100% precision at p>=0.80

    @Column(name = "base_weak_threshold", nullable = false)
    @Builder.Default
    private Double baseWeakThreshold = 0.30;

    @Column(name = "t_cap", nullable = false)
    @Builder.Default
    private Double tCap = 0.95; // 95% maximum effective threshold cap

    @Column(name = "alpha", nullable = false)
    @Builder.Default
    private Double alpha = 0.20; // Risk penalty acceleration factor

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.updatedAt = LocalDateTime.now();
    }
}
