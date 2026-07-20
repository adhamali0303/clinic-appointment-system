// src/main/java/com/example/clinicappointmentsystem/repository/DoctorRepository.java
package com.example.clinicappointmentsystem.repository;

import com.example.clinicappointmentsystem.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Spring Data repository for {@link Doctor} persistence operations.
 */
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    /**
     * Looks up the doctor profile linked to a user account by email, used to
     * scope a DOCTOR-role caller to their own appointments.
     *
     * @param email the linked user's email
     * @return the matching doctor profile, if one exists
     */
    Optional<Doctor> findByUserEmail(String email);
}
