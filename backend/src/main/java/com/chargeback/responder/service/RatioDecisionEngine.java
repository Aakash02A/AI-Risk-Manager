package com.chargeback.responder.service;

import com.chargeback.responder.entity.DisputeRatioState;
import com.chargeback.responder.entity.RiskConfig;
import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Service;

@Service
public class RatioDecisionEngine {

    @Data
    @Builder
    public static class DecisionResult {
        private String decision; // AUTO_RESPOND (STRONG), HUMAN_REVIEW (BORDERLINE), RECOMMEND_REFUND (WEAK)
        private double winProbability;
        private double effectiveThreshold;
        private double weakThreshold;
        private String explanation;
        private String healthStatus; // HEALTHY, APPROACHING_CEILING, OVER_CEILING
    }

    /**
     * Calculates the dynamic effective auto-defense threshold.
     * Formula: T_eff = min(T_cap, T_base + alpha * (R_loss / R_ceiling)^2)
     */
    public double calculateEffectiveThreshold(DisputeRatioState ratioState, RiskConfig riskConfig) {
        double rLoss = ratioState != null && ratioState.getLossRatio() != null ? ratioState.getLossRatio() : 0.009;
        double rCeiling = riskConfig != null && riskConfig.getNetworkCeiling() != null ? riskConfig.getNetworkCeiling() : 0.015;
        double tBase = riskConfig != null && riskConfig.getBaseStrongThreshold() != null ? riskConfig.getBaseStrongThreshold() : 0.80;
        double tCap = riskConfig != null && riskConfig.getTCap() != null ? riskConfig.getTCap() : 0.95;
        double alpha = riskConfig != null && riskConfig.getAlpha() != null ? riskConfig.getAlpha() : 0.20;

        if (rCeiling <= 0) {
            rCeiling = 0.015;
        }

        double ratioTerm = rLoss / rCeiling;
        double dynamicAdjustment = alpha * (ratioTerm * ratioTerm);
        double rawEffective = tBase + dynamicAdjustment;

        double effectiveThreshold = Math.min(tCap, Math.max(tBase, rawEffective));
        return Math.round(effectiveThreshold * 1000.0) / 1000.0;
    }

    /**
     * Evaluates a case win probability against ratio state and risk config parameters.
     */
    public DecisionResult evaluateRatioAwareDecision(double winProbability, DisputeRatioState ratioState, RiskConfig riskConfig) {
        double rLoss = ratioState != null && ratioState.getLossRatio() != null ? ratioState.getLossRatio() : 0.009;
        double rCeiling = riskConfig != null && riskConfig.getNetworkCeiling() != null ? riskConfig.getNetworkCeiling() : 0.015;
        double weakThreshold = riskConfig != null && riskConfig.getBaseWeakThreshold() != null ? riskConfig.getBaseWeakThreshold() : 0.30;
        double effectiveThreshold = calculateEffectiveThreshold(ratioState, riskConfig);

        String healthStatus;
        if (rLoss >= rCeiling) {
            healthStatus = "OVER_CEILING";
        } else if (rLoss >= 0.8 * rCeiling) {
            healthStatus = "APPROACHING_CEILING";
        } else {
            healthStatus = "HEALTHY";
        }

        String decision;
        String explanation;

        double winPct = Math.round(winProbability * 1000.0) / 10.0;
        double effPct = Math.round(effectiveThreshold * 1000.0) / 10.0;
        double lossPct = Math.round(rLoss * 1000.0) / 10.0;
        double ceilingPct = Math.round(rCeiling * 1000.0) / 10.0;

        if (winProbability >= effectiveThreshold) {
            decision = "STRONG";
            explanation = String.format(
                "Decision assigned: STRONG (win probability %.1f%% >= effective threshold %.1f%%). Trailing loss ratio is %.2f%% vs %.2f%% ceiling. Auto-defense authorized.",
                winPct, effPct, lossPct, ceilingPct
            );
        } else if (winProbability >= weakThreshold) {
            decision = "BORDERLINE";
            explanation = String.format(
                "Decision assigned: HUMAN_REVIEW (win probability %.1f%% vs effective threshold %.1f%%). Case economics are sensitive to the merchant's current dispute ratio (%.2f%% vs %.2f%% ceiling) — human review required to weigh account risk.",
                winPct, effPct, lossPct, ceilingPct
            );
        } else {
            decision = "WEAK";
            explanation = String.format(
                "Decision assigned: WEAK (win probability %.1f%% < weak threshold %.1f%%). Recommend refund to minimize defense friction and protect dispute ratio.",
                winPct, Math.round(weakThreshold * 1000.0) / 10.0
            );
        }

        return DecisionResult.builder()
            .decision(decision)
            .winProbability(winProbability)
            .effectiveThreshold(effectiveThreshold)
            .weakThreshold(weakThreshold)
            .explanation(explanation)
            .healthStatus(healthStatus)
            .build();
    }
}
