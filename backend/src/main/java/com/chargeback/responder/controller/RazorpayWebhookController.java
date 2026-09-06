package com.chargeback.responder.controller;

import com.chargeback.responder.dto.CaseResponseDto;
import com.chargeback.responder.service.CaseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class RazorpayWebhookController {

    private final CaseService caseService;
    private final com.chargeback.responder.service.RazorpayService razorpayService;

    /**
     * Ingest live Razorpay webhook (e.g. dispute.created, dispute.action_required).
     */
    @PostMapping("/webhooks/razorpay")
    public ResponseEntity<Map<String, Object>> handleRazorpayWebhook(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature
    ) {
        log.info("Received Razorpay webhook event: {}, signature present: {}", payload.get("event"), signature != null);

        if (signature != null && !signature.isBlank() && !razorpayService.verifyWebhookSignature(payload.toString(), signature)) {
            log.warn("Rejected Razorpay webhook due to HMAC SHA-256 signature verification failure.");
            return ResponseEntity.status(401).body(Map.of(
                    "status", "error",
                    "message", "Invalid X-Razorpay-Signature: Webhook signature verification failed."
            ));
        }

        CaseResponseDto caseResponse = caseService.ingestRazorpayWebhook(payload);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Razorpay dispute webhook processed and case ingested");
        response.put("case_id", caseResponse.getCaseId());
        response.put("razorpay_dispute_id", caseResponse.getRazorpayDisputeId());
        response.put("payment_id", caseResponse.getPaymentId());
        return ResponseEntity.ok(response);
    }

    /**
     * Get operational status, active mode, and endpoints of Razorpay Service.
     */
    @GetMapping("/razorpay/status")
    public ResponseEntity<Map<String, Object>> getRazorpayStatus() {
        return ResponseEntity.ok(razorpayService.getServiceStatus());
    }

    /**
     * Trigger sync of open disputes from Razorpay Gateway API.
     */
    @PostMapping("/razorpay/sync")
    public ResponseEntity<Map<String, Object>> syncRazorpayDisputes() {
        int count = caseService.syncFromRazorpayService();
        Map<String, Object> res = new HashMap<>();
        res.put("status", "success");
        res.put("message", "Dispute sync cycle completed from Razorpay Service");
        res.put("synced_count", count);
        return ResponseEntity.ok(res);
    }

    /**
     * Simulate a realistic Razorpay dispute webhook event for testing & demonstrations.
     */
    @PostMapping("/razorpay/simulate")
    public ResponseEntity<CaseResponseDto> simulateWebhook(
            @RequestParam(defaultValue = "item_not_received") String reason,
            @RequestParam(defaultValue = "45000.00") Double amount
    ) {
        String dispId = "disp_" + UUID.randomUUID().toString().substring(0, 10).replace("-", "");
        String payId = "pay_" + UUID.randomUUID().toString().substring(0, 10).replace("-", "");

        Map<String, Object> entity = new HashMap<>();
        entity.put("id", dispId);
        entity.put("payment_id", payId);
        entity.put("amount", (long) (amount * 100)); // paise
        entity.put("currency", "INR");
        entity.put("reason_code", reason);
        entity.put("status", "action_required");
        entity.put("phase", "chargeback");

        Map<String, Object> dispute = new HashMap<>();
        dispute.put("entity", entity);

        Map<String, Object> payload = new HashMap<>();
        payload.put("dispute", dispute);

        Map<String, Object> root = new HashMap<>();
        root.put("entity", "event");
        root.put("account_id", "acc_RZPMerchant01");
        root.put("event", "dispute.created");
        root.put("payload", payload);

        CaseResponseDto ingested = caseService.ingestRazorpayWebhook(root);
        return ResponseEntity.ok(ingested);
    }

    /**
     * Contest dispute directly on Razorpay Dispute API with formal contest form payload.
     */
    @PostMapping("/cases/{caseId}/razorpay/contest")
    public ResponseEntity<CaseResponseDto> contestOnRazorpay(
            @PathVariable String caseId,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String summary = body != null ? body.get("summary") : null;
        String notes = body != null ? body.get("notes") : null;
        CaseResponseDto updated = caseService.contestOnRazorpay(caseId, summary, notes);
        return ResponseEntity.ok(updated);
    }

    /**
     * Accept & concede dispute on Razorpay (close liability & refund).
     */
    @PostMapping("/cases/{caseId}/razorpay/accept")
    public ResponseEntity<CaseResponseDto> acceptOnRazorpay(@PathVariable String caseId) {
        CaseResponseDto updated = caseService.acceptOnRazorpay(caseId);
        return ResponseEntity.ok(updated);
    }

}
