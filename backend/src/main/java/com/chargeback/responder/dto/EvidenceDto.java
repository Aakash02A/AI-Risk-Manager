package com.chargeback.responder.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvidenceDto {
    @NotNull(message = "order_exists is required")
    @JsonProperty("order_exists")
    private Boolean orderExists;

    @NotNull(message = "invoice_exists is required")
    @JsonProperty("invoice_exists")
    private Boolean invoiceExists;

    @NotNull(message = "payment_confirmed is required")
    @JsonProperty("payment_confirmed")
    private Boolean paymentConfirmed;

    @NotNull(message = "delivery_status is required")
    @JsonProperty("delivery_status")
    private String deliveryStatus;

    @NotNull(message = "tracking_number_present is required")
    @JsonProperty("tracking_number_present")
    private Boolean trackingNumberPresent;

    @NotNull(message = "customer_communication is required")
    @JsonProperty("customer_communication")
    private String customerCommunication;

    @NotNull(message = "refund_status is required")
    @JsonProperty("refund_status")
    private String refundStatus;

    @NotNull(message = "customer_prior_dispute_count is required")
    @JsonProperty("customer_prior_dispute_count")
    private Integer customerPriorDisputeCount;
}
