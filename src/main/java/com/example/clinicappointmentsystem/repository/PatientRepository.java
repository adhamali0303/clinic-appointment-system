// src/main/java/com/example/clinicappointmentsystem/repository/PatientRepository.java
package com.example.clinicappointmentsystem.repository;

import com.example.clinicappointmentsystem.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data repository for {@link Patient} persistence operations.
 */
public interface PatientRepository extends JpaRepository<Patient, Long> {
}
