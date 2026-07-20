// src/main/java/com/example/clinicappointmentsystem/service/AuditLogService.java
package com.example.clinicappointmentsystem.service;

import com.example.clinicappointmentsystem.model.AuditLog;
import com.example.clinicappointmentsystem.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Records audit trail entries for mutating operations across the API.
 */
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Persists a single audit log entry with the current timestamp.
     *
     * @param action      short code identifying the action performed (e.g. "DOCTOR_CREATED")
     * @param performedBy email of the authenticated user who performed the action
     * @param details     free-form description of what changed
     */
    public void log(String action, String performedBy, String details) {
        AuditLog entry = AuditLog.builder()
                .action(action)
                .performedBy(performedBy)
                .timestamp(LocalDateTime.now())
                .details(details)
                .build();
        auditLogRepository.save(entry);
    }
}
