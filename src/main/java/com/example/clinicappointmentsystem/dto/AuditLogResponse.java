// src/main/java/com/example/clinicappointmentsystem/dto/AuditLogResponse.java
package com.example.clinicappointmentsystem.dto;

import java.time.LocalDateTime;

/**
 * Audit trail entry projection returned by the API.
 *
 * @param id          entry id
 * @param action      short code identifying the action performed (e.g. "DOCTOR_CREATED")
 * @param performedBy email of the authenticated user who performed the action
 * @param timestamp   when the action was performed
 * @param details     free-form description of what changed
 */
public record AuditLogResponse(
        Long id,
        String action,
        String performedBy,
        LocalDateTime timestamp,
        String details
) {
}
