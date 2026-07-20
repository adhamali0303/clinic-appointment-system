// src/main/java/com/example/clinicappointmentsystem/controller/AuditLogController.java
package com.example.clinicappointmentsystem.controller;

import com.example.clinicappointmentsystem.dto.AuditLogResponse;
import com.example.clinicappointmentsystem.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Exposes read access to the audit trail. ADMIN only.
 */
@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    /**
     * Lists the most recent audit log entries, most recent first. ADMIN only.
     * Optional filters: action (exact match) and limit (defaults to 20).
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<AuditLogResponse> search(@RequestParam(required = false) String action,
                                          @RequestParam(required = false) Integer limit) {
        return auditLogService.search(action, limit);
    }
}
