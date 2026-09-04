package com.chargeback.responder.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dispute_ratio_states")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisputeRatioState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dispute_ratio_state_id")
    private Long id;

    @Column(name = "period_days", nullable = false)
    @Builder.Default
    private Integer periodDays = 30;

    @Column(name = "disputes_count", nullable = false)
    @Builder.Default
    private Integer disputesCount = 1000;

    @Column(name = "disputes_lost_count", nullable = false)
    @Builder.Default
    private Integer disputesLostCount = 9;

    @Column(name = "disputes_won_count", nullable = false)
    @Builder.Default
    private Integer disputesWonCount = 91;

    @Column(name = "disputes_fought_count", nullable = false)
    @Builder.Default
    private Integer disputesFoughtCount = 100;

    @Column(name = "loss_ratio", nullable = false)
    @Builder.Default
    private Double lossRatio = 0.009; // 0.90% current loss ratio

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        if (this.disputesCount != null && this.disputesCount > 0) {
            this.lossRatio = (double) this.disputesLostCount / (double) this.disputesCount;
        } else {
            this.lossRatio = 0.0;
        }
        this.updatedAt = LocalDateTime.now();
    }
}
