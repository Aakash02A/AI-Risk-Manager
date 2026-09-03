package com.chargeback.responder.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MlPredictRequest {
    @JsonProperty("dispute_amount")
    private BigDecimal disputeAmount;

    @JsonProperty("dispute_reason")
    private String disputeReason;

    @JsonProperty("days_since_order")
    private Integer daysSinceOrder;

    @JsonProperty("order_exists")
    private Boolean orderExists;

    @JsonProperty("invoice_exists")
    private Boolean invoiceExists;

    @JsonProperty("payment_confirmed")
    private Boolean paymentConfirmed;

    @JsonProperty("delivery_status")
    private String deliveryStatus;

    @JsonProperty("tracking_number_present")
    private Boolean trackingNumberPresent;

    @JsonProperty("customer_communication")
    private String customerCommunication;

    @JsonProperty("refund_status")
    private String refundStatus;

    @JsonProperty("customer_prior_dispute_count")
    private Integer customerPriorDisputeCount;
}
