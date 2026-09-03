package com.chargeback.responder.repository;

import com.chargeback.responder.entity.DisputeRatioState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DisputeRatioStateRepository extends JpaRepository<DisputeRatioState, Long> {
    Optional<DisputeRatioState> findTopByOrderByIdDesc();
}
