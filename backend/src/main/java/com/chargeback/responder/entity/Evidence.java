package com.chargeback.responder.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "evidence")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Evidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "evidence_id")
    private Long id;

    @Column(name = "case_id", unique = true, nullable = false, length = 64)
    private String caseId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispute_id", referencedColumnName = "dispute_id")
    private Dispute dispute;

    @Column(name = "order_exists", nullable = false)
    private Boolean orderExists;

    @Column(name = "invoice_exists", nullable = false)
    private Boolean invoiceExists;

    @Column(name = "payment_confirmed", nullable = false)
    private Boolean paymentConfirmed;

    @Column(name = "delivery_status", nullable = false, length = 64)
    private String deliveryStatus;

    @Column(name = "tracking_number_present", nullable = false)
    private Boolean trackingNumberPresent;

    @Column(name = "customer_communication", nullable = false, length = 64)
    private String customerCommunication;

    @Column(name = "refund_status", nullable = false, length = 64)
    private String refundStatus;

    @Column(name = "customer_prior_dispute_count", nullable = false)
    private Integer customerPriorDisputeCount;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
