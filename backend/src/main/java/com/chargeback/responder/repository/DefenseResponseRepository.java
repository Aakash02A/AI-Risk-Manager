package com.chargeback.responder.repository;

import com.chargeback.responder.entity.DefenseResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DefenseResponseRepository extends JpaRepository<DefenseResponse, Long> {
    Optional<DefenseResponse> findTopByCaseIdOrderByCreatedAtDesc(String caseId);
    void deleteByCaseId(String caseId);
}
