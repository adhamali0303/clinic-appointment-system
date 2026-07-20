// src/main/java/com/example/clinicappointmentsystem/service/AuditLogService.java
package com.example.clinicappointmentsystem.service;

import com.example.clinicappointmentsystem.dto.AuditLogResponse;
import com.example.clinicappointmentsystem.model.AuditLog;
import com.example.clinicappointmentsystem.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Records and reads audit trail entries for mutating operations across the API.
 */
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private static final int DEFAULT_LIMIT = 20;

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

    /**
     * Lists the most recent audit log entries, most recent first, optionally
     * filtered by exact action type and capped by limit (defaults to 20).
     */
    public List<AuditLogResponse> search(String action, Integer limit) {
        int effectiveLimit = (limit != null && limit > 0) ? limit : DEFAULT_LIMIT;
        Pageable pageable = PageRequest.of(0, effectiveLimit);

        List<AuditLog> entries = (action != null && !action.isBlank())
                ? auditLogRepository.findByActionOrderByTimestampDesc(action, pageable)
                : auditLogRepository.findAllByOrderByTimestampDesc(pageable);

        return entries.stream().map(this::toResponse).toList();
    }

    private AuditLogResponse toResponse(AuditLog entry) {
        return new AuditLogResponse(
                entry.getId(),
                entry.getAction(),
                entry.getPerformedBy(),
                entry.getTimestamp(),
                entry.getDetails()
        );
    }
}
