// src/main/java/com/example/clinicappointmentsystem/model/AuditLog.java
package com.example.clinicappointmentsystem.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * JPA entity mapping the {@code audit_log} table.
 * Records who performed a mutating action, and when, for traceability.
 */
@Entity
@Table(name = "audit_log")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(name = "performed_by", nullable = false, length = 100)
    private String performedBy;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(length = 500)
    private String details;
}
