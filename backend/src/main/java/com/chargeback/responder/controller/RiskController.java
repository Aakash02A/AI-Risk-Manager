package com.chargeback.responder.controller;

import com.chargeback.responder.entity.DisputeRatioState;
import com.chargeback.responder.entity.RiskConfig;
import com.chargeback.responder.repository.DisputeRatioStateRepository;
import com.chargeback.responder.repository.RiskConfigRepository;
import com.chargeback.responder.service.RatioDecisionEngine;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/risk")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class RiskController {

    private final RiskConfigRepository riskConfigRepository;
    private final DisputeRatioStateRepository disputeRatioStateRepository;
    private final RatioDecisionEngine ratioDecisionEngine;

    @GetMapping("/ratio-status")
    public ResponseEntity<Map<String, Object>> getRatioStatus() {
        RiskConfig config = riskConfigRepository.findById(1L)
            .orElseGet(() -> riskConfigRepository.findTopByOrderByIdDesc()
                .orElseGet(() -> riskConfigRepository.save(new RiskConfig())));
        config.setId(1L);

        DisputeRatioState ratioState = disputeRatioStateRepository.findById(1L)
            .orElseGet(() -> disputeRatioStateRepository.findTopByOrderByIdDesc()
                .orElseGet(() -> disputeRatioStateRepository.save(new DisputeRatioState())));
        ratioState.setId(1L);

        double effThreshold = ratioDecisionEngine.calculateEffectiveThreshold(ratioState, config);
        double lossRatio = ratioState.getLossRatio();
        double ceiling = config.getNetworkCeiling();
        double distance = ceiling - lossRatio;

        String healthStatus;
        if (lossRatio >= ceiling) {
            healthStatus = "OVER_CEILING";
        } else if (lossRatio >= 0.8 * ceiling) {
            healthStatus = "APPROACHING_CEILING";
        } else {
            healthStatus = "HEALTHY";
        }

        Map<String, Object> status = new HashMap<>();
        status.put("loss_ratio", lossRatio);
        status.put("loss_ratio_pct", String.format("%.2f%%", lossRatio * 100));
        status.put("network_ceiling", ceiling);
        status.put("network_ceiling_pct", String.format("%.2f%%", ceiling * 100));
        status.put("distance_to_ceiling_pct", String.format("%.2f%%", distance * 100));
        status.put("effective_threshold", effThreshold);
        status.put("effective_threshold_pct", String.format("%.1f%%", effThreshold * 100));
        status.put("base_strong_threshold", config.getBaseStrongThreshold());
        status.put("base_weak_threshold", config.getBaseWeakThreshold());
        status.put("representation_fee_inr", config.getRepresentationFee());
        status.put("human_review_cost_inr", config.getHumanReviewCost());
        status.put("t_cap", config.getTCap());
        status.put("alpha", config.getAlpha());
        status.put("health_status", healthStatus);
        status.put("period_days", ratioState.getPeriodDays());
        status.put("disputes_count", ratioState.getDisputesCount());
        status.put("disputes_lost_count", ratioState.getDisputesLostCount());
        status.put("disputes_won_count", ratioState.getDisputesWonCount());
        status.put("updated_at", ratioState.getUpdatedAt());

        return ResponseEntity.ok(status);
    }

    @PostMapping("/config")
    public ResponseEntity<Map<String, Object>> updateRiskConfig(@RequestBody Map<String, Object> payload) {
        RiskConfig config = riskConfigRepository.findTopByOrderByIdDesc()
            .orElseGet(RiskConfig::new);

        if (payload.containsKey("network_ceiling")) {
            config.setNetworkCeiling(Double.parseDouble(payload.get("network_ceiling").toString()));
        }
        if (payload.containsKey("representation_fee")) {
            config.setRepresentationFee(Double.parseDouble(payload.get("representation_fee").toString()));
        }
        if (payload.containsKey("human_review_cost")) {
            config.setHumanReviewCost(Double.parseDouble(payload.get("human_review_cost").toString()));
        }
        if (payload.containsKey("trailing_period_days")) {
            config.setTrailingPeriodDays(Integer.parseInt(payload.get("trailing_period_days").toString()));
        }
        if (payload.containsKey("base_strong_threshold")) {
            config.setBaseStrongThreshold(Double.parseDouble(payload.get("base_strong_threshold").toString()));
        }
        if (payload.containsKey("base_weak_threshold")) {
            config.setBaseWeakThreshold(Double.parseDouble(payload.get("base_weak_threshold").toString()));
        }
        if (payload.containsKey("t_cap")) {
            config.setTCap(Double.parseDouble(payload.get("t_cap").toString()));
        }

        RiskConfig saved = riskConfigRepository.save(config);
        return getRatioStatus();
    }
}
