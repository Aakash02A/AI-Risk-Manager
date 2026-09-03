package com.chargeback.responder.repository;

import com.chargeback.responder.entity.RiskConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RiskConfigRepository extends JpaRepository<RiskConfig, Long> {
    Optional<RiskConfig> findTopByOrderByIdDesc();
}
