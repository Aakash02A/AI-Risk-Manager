package com.chargeback.responder.service;

import com.chargeback.responder.entity.AuditLog;
import com.chargeback.responder.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(String caseId, String action, String details, String actor) {
        AuditLog entry = AuditLog.builder()
                .caseId(caseId)
                .action(action)
                .details(details)
                .actor(actor != null ? actor : "SYSTEM")
                .build();
        auditLogRepository.save(entry);
    }
}
