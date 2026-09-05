package com.chargeback.responder.repository;

import com.chargeback.responder.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByCaseIdOrderByCreatedAtAsc(String caseId);
    void deleteByCaseId(String caseId);
}
