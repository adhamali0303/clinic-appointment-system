// src/main/java/com/example/clinicappointmentsystem/repository/AuditLogRepository.java
package com.example.clinicappointmentsystem.repository;

import com.example.clinicappointmentsystem.model.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Spring Data repository for {@link AuditLog} persistence operations.
 */
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Most recent entries first, capped by the given {@link Pageable}.
     */
    List<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    /**
     * Most recent entries matching an exact action type, capped by the given {@link Pageable}.
     */
    List<AuditLog> findByActionOrderByTimestampDesc(String action, Pageable pageable);
}
