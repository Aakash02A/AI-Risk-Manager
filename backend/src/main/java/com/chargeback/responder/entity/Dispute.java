package com.chargeback.responder.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "disputes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dispute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dispute_id")
    private Long id;

    @Column(name = "case_id", unique = true, nullable = false, length = 64)
    private String caseId;

    @Column(name = "dispute_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal disputeAmount;

    @Column(name = "dispute_reason", nullable = false, length = 64)
    private String disputeReason;

    @Column(name = "days_since_order", nullable = false)
    private Integer daysSinceOrder;

    @OneToOne(mappedBy = "dispute", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Evidence evidence;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
