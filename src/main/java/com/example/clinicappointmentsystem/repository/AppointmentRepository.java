// src/main/java/com/example/clinicappointmentsystem/repository/AppointmentRepository.java
package com.example.clinicappointmentsystem.repository;

import com.example.clinicappointmentsystem.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Spring Data repository for {@link Appointment} persistence operations.
 * Extends {@link JpaSpecificationExecutor} to support the dynamic, optional
 * filters used by the appointment search endpoint (a plain JPQL "field = :x
 * OR :x IS NULL" query hits a known PostgreSQL/JDBC parameter-type-inference
 * error for the bare "IS NULL" side, so filtering is built as a Specification
 * instead, in AppointmentServiceImpl).
 */
public interface AppointmentRepository extends JpaRepository<Appointment, Long>, JpaSpecificationExecutor<Appointment> {

    /**
     * Looks up a doctor's non-cancelled appointments within a datetime range, used
     * to determine which slots are already booked.
     *
     * @param doctorId       the doctor to look up
     * @param start          inclusive lower bound of the range
     * @param end            exclusive upper bound of the range
     * @param excludedStatus the status to exclude (i.e. cancelled appointments)
     * @return the matching appointments
     */
    List<Appointment> findByDoctorIdAndAppointmentDateTimeBetweenAndStatusNot(
            Long doctorId, LocalDateTime start, LocalDateTime end, Appointment.Status excludedStatus);
}
