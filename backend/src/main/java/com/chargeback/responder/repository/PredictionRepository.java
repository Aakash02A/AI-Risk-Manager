package com.chargeback.responder.repository;

import com.chargeback.responder.entity.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PredictionRepository extends JpaRepository<Prediction, Long> {
    Optional<Prediction> findTopByCaseIdOrderByCreatedAtDesc(String caseId);
    List<Prediction> findByDecision(String decision);
}
