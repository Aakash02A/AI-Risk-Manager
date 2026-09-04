package com.chargeback.responder.controller;

import com.chargeback.responder.entity.Dispute;
import com.chargeback.responder.entity.Prediction;
import com.chargeback.responder.entity.RiskConfig;
import com.chargeback.responder.repository.DisputeRepository;
import com.chargeback.responder.repository.PredictionRepository;
import com.chargeback.responder.repository.RiskConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class StatsController {

    private final DisputeRepository disputeRepository;
    private final PredictionRepository predictionRepository;
    private final RiskConfigRepository riskConfigRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<Dispute> disputes = disputeRepository.findAll();
        long totalCases = disputes.size();

        long strongCount = 0;
        long borderlineCount = 0;
        long weakCount = 0;
        long unclassifiedCount = 0;

        BigDecimal moneyDefended = BigDecimal.ZERO;
        BigDecimal totalDisputed = BigDecimal.ZERO;

        for (Dispute d : disputes) {
            if (d.getDisputeAmount() != null) {
                totalDisputed = totalDisputed.add(d.getDisputeAmount());
            }

            Optional<Prediction> predOpt = predictionRepository.findTopByCaseIdOrderByCreatedAtDesc(d.getCaseId());
            if (predOpt.isPresent()) {
                String decision = predOpt.get().getDecision();
                if ("STRONG".equalsIgnoreCase(decision)) {
                    strongCount++;
                    if (d.getDisputeAmount() != null) {
                        moneyDefended = moneyDefended.add(d.getDisputeAmount());
                    }
                } else if ("BORDERLINE".equalsIgnoreCase(decision)) {
                    borderlineCount++;
                } else if ("WEAK".equalsIgnoreCase(decision)) {
                    weakCount++;
                } else {
                    unclassifiedCount++;
                }
            } else {
                unclassifiedCount++;
            }
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total_cases", totalCases);
        stats.put("strong_count", strongCount);
        stats.put("borderline_count", borderlineCount);
        stats.put("weak_count", weakCount);
        stats.put("unclassified_count", unclassifiedCount);
        stats.put("money_defended_inr", moneyDefended);
        stats.put("total_disputed_inr", totalDisputed);

        return ResponseEntity.ok(stats);
    }

    @PostMapping("/settings/thresholds")
    public ResponseEntity<Map<String, Object>> updateThresholds(@RequestBody Map<String, Object> payload) {
        RiskConfig config = riskConfigRepository.findTopByOrderByIdDesc()
                .orElseGet(() -> riskConfigRepository.save(new RiskConfig()));

        if (payload.containsKey("weak_threshold")) {
            config.setBaseWeakThreshold(Double.parseDouble(payload.get("weak_threshold").toString()));
        }
        if (payload.containsKey("strong_threshold")) {
            config.setBaseStrongThreshold(Double.parseDouble(payload.get("strong_threshold").toString()));
        }

        RiskConfig saved = riskConfigRepository.save(config);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("weak_threshold", saved.getBaseWeakThreshold());
        res.put("strong_threshold", saved.getBaseStrongThreshold());
        return ResponseEntity.ok(res);
    }
}
