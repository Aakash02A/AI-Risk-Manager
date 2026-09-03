package com.chargeback.responder.service;

import com.chargeback.responder.entity.Dispute;
import com.chargeback.responder.entity.Evidence;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.util.Locale;

@Service
public class LlmOrchestrationService {

    @Value("${app.llm.api-key:}")
    private String apiKey;

    @Value("${app.llm.model:gemini-3.8-flash}")
    private String model;

    public String buildPrompt(Dispute dispute, Evidence evidence) {
        NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
        String formattedAmount = currencyFormat.format(dispute.getDisputeAmount());

        return String.format("""
            Dispute Case ID: %s
            Claimed Dispute Reason: %s
            Disputed Transaction Amount: %s
            Days Elapsed Since Transaction: %d days

            RECORDED CASE EVIDENCE:
            - Order Exists in System: %s (Verified Order Record)
            - Invoice Available: %s (Generated Tax Invoice)
            - Payment Status: %s (3DS / Authorization Confirmed)
            - Fulfillment & Delivery Status: %s
            - Shipping Tracking ID Attached: %s
            - Customer Communication Log: %s
            - Prior Refund Status: %s
            - Customer Historical Dispute Count: %d prior disputes

            Draft a compelling, evidence-grounded merchant chargeback defense statement following the specified 8-part structure.
            """,
                dispute.getCaseId(),
                dispute.getDisputeReason(),
                formattedAmount,
                dispute.getDaysSinceOrder(),
                evidence.getOrderExists() ? "YES" : "NO",
                evidence.getInvoiceExists() ? "YES" : "NO",
                evidence.getPaymentConfirmed() ? "CONFIRMED" : "UNCONFIRMED",
                evidence.getDeliveryStatus(),
                evidence.getTrackingNumberPresent() ? "YES" : "NO",
                evidence.getCustomerCommunication(),
                evidence.getRefundStatus(),
                evidence.getCustomerPriorDisputeCount()
        );
    }
}
