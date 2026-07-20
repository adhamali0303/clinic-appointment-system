// src/main/java/com/example/clinicappointmentsystem/repository/AuditLogRepository.java
package com.example.clinicappointmentsystem.repository;

import com.example.clinicappointmentsystem.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data repository for {@link AuditLog} persistence operations.
 */
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
