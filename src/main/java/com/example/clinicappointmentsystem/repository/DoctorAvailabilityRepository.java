// src/main/java/com/example/clinicappointmentsystem/repository/DoctorAvailabilityRepository.java
package com.example.clinicappointmentsystem.repository;

import com.example.clinicappointmentsystem.model.DoctorAvailability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

/**
 * Spring Data repository for {@link DoctorAvailability} persistence operations.
 */
public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {

    /**
     * Looks up a doctor's availability windows for a specific date, used to
     * compute free appointment slots.
     *
     * @param doctorId the doctor to look up
     * @param date     the calendar date to look up
     * @return the availability windows on that date, if any
     */
    List<DoctorAvailability> findByDoctorIdAndDate(Long doctorId, LocalDate date);
}
