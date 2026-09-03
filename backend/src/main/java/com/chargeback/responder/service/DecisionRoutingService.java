package com.chargeback.responder.service;

import com.chargeback.responder.entity.DisputeRatioState;
import com.chargeback.responder.entity.RiskConfig;
import com.chargeback.responder.repository.DisputeRatioStateRepository;
import com.chargeback.responder.repository.RiskConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class DecisionRoutingService {

    private final RiskConfigRepository riskConfigRepository;
    private final DisputeRatioStateRepository disputeRatioStateRepository;
    private final RatioDecisionEngine ratioDecisionEngine;

    public RatioDecisionEngine.DecisionResult routeRatioAwareProbability(BigDecimal winProbability) {
        if (winProbability == null) {
            throw new IllegalArgumentException("winProbability cannot be null");
        }

        RiskConfig config = riskConfigRepository.findTopByOrderByIdDesc()
            .orElseGet(() -> riskConfigRepository.save(new RiskConfig()));

        DisputeRatioState ratioState = disputeRatioStateRepository.findTopByOrderByIdDesc()
            .orElseGet(() -> disputeRatioStateRepository.save(new DisputeRatioState()));

        return ratioDecisionEngine.evaluateRatioAwareDecision(
            winProbability.doubleValue(),
            ratioState,
            config
        );
    }

    public String routeProbability(BigDecimal winProbability) {
        return routeRatioAwareProbability(winProbability).getDecision();
    }
}
