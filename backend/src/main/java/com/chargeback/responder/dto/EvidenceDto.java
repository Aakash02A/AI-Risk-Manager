package com.chargeback.responder.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvidenceDto {
    @NotNull(message = "order_exists is required")
    private Boolean orderExists;

    @NotNull(message = "invoice_exists is required")
    private Boolean invoiceExists;

    @NotNull(message = "payment_confirmed is required")
    private Boolean paymentConfirmed;

    @NotNull(message = "delivery_status is required")
    private String deliveryStatus;

    @NotNull(message = "tracking_number_present is required")
    private Boolean trackingNumberPresent;

    @NotNull(message = "customer_communication is required")
    private String customerCommunication;

    @NotNull(message = "refund_status is required")
    private String refundStatus;

    @NotNull(message = "customer_prior_dispute_count is required")
    private Integer customerPriorDisputeCount;
}
