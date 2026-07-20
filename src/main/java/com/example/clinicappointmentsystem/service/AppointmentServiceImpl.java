// src/main/java/com/example/clinicappointmentsystem/service/AppointmentServiceImpl.java
package com.example.clinicappointmentsystem.service;

import com.example.clinicappointmentsystem.dto.AppointmentRequestDto;
import com.example.clinicappointmentsystem.dto.AppointmentResponseDto;
import com.example.clinicappointmentsystem.exception.AppointmentConflictException;
import com.example.clinicappointmentsystem.exception.ResourceNotFoundException;
import com.example.clinicappointmentsystem.model.Appointment;
import com.example.clinicappointmentsystem.model.Doctor;
import com.example.clinicappointmentsystem.model.DoctorAvailability;
import com.example.clinicappointmentsystem.model.Patient;
import com.example.clinicappointmentsystem.repository.AppointmentRepository;
import com.example.clinicappointmentsystem.repository.DoctorAvailabilityRepository;
import com.example.clinicappointmentsystem.repository.DoctorRepository;
import com.example.clinicappointmentsystem.repository.PatientRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Books, cancels, reschedules, and looks up appointments, enforcing doctor
 * availability, active-doctor, and double-booking rules along the way.
 */
@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private static final int SLOT_MINUTES = 30;
    private static final String ADMIN_AUTHORITY = "ROLE_ADMIN";
    private static final String RECEPTIONIST_AUTHORITY = "ROLE_RECEPTIONIST";
    private static final String DOCTOR_AUTHORITY = "ROLE_DOCTOR";

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final DoctorAvailabilityRepository doctorAvailabilityRepository;
    private final AuditLogService auditLogService;

    /**
     * {@inheritDoc}
     *
     * @throws ResourceNotFoundException    if the doctor or patient does not exist
     * @throws IllegalArgumentException     if the doctor is inactive, or the requested range is outside their availability
     * @throws AppointmentConflictException if the doctor already has an overlapping appointment
     */
    @Override
    public AppointmentResponseDto bookAppointment(AppointmentRequestDto request) {
        Doctor doctor = doctorRepository.findById(request.doctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + request.doctorId()));
        Patient patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + request.patientId()));

        assertDoctorActive(doctor);
        assertWithinAvailability(doctor.getId(), request.startTime(), request.endTime());
        assertNoConflict(doctor.getId(), request.startTime(), request.endTime(), null);

        Appointment appointment = Appointment.builder()
                .doctor(doctor)
                .patient(patient)
                .appointmentDateTime(request.startTime())
                .status(Appointment.Status.SCHEDULED)
                .build();
        Appointment saved = appointmentRepository.save(appointment);

        auditLogService.log("APPOINTMENT_BOOKED", currentUserEmail(),
                "Booked appointment id=" + saved.getId() + " doctorId=" + doctor.getId()
                        + " patientId=" + patient.getId() + " startTime=" + request.startTime());

        return toResponse(saved);
    }

    /**
     * {@inheritDoc}
     *
     * @throws ResourceNotFoundException if no appointment has that id
     * @throws AccessDeniedException     if the caller is a DOCTOR who does not own this appointment
     */
    @Override
    public AppointmentResponseDto cancelAppointment(Long appointmentId) {
        Appointment appointment = getAppointmentOrThrow(appointmentId);
        assertAdminReceptionistOrOwningDoctor(appointment);

        Appointment.Status previousStatus = appointment.getStatus();
        appointment.setStatus(Appointment.Status.CANCELED);
        Appointment saved = appointmentRepository.save(appointment);

        auditLogService.log("APPOINTMENT_CANCELLED", currentUserEmail(),
                "Cancelled appointment id=" + saved.getId() + " previousStatus=" + previousStatus);

        return toResponse(saved);
    }

    /**
     * {@inheritDoc}
     *
     * @throws ResourceNotFoundException    if no appointment has that id
     * @throws AccessDeniedException        if the caller is a DOCTOR who does not own this appointment
     * @throws IllegalArgumentException     if the doctor is inactive, or the new range is outside their availability
     * @throws AppointmentConflictException if the doctor already has a different overlapping appointment
     */
    @Override
    public AppointmentResponseDto rescheduleAppointment(Long appointmentId, AppointmentRequestDto request) {
        Appointment appointment = getAppointmentOrThrow(appointmentId);
        assertAdminReceptionistOrOwningDoctor(appointment);

        // Only the time changes here; the request's doctorId/patientId are not
        // applied, since rescheduling does not reassign the doctor or patient.
        Doctor doctor = appointment.getDoctor();
        assertDoctorActive(doctor);
        assertWithinAvailability(doctor.getId(), request.startTime(), request.endTime());
        assertNoConflict(doctor.getId(), request.startTime(), request.endTime(), appointment.getId());

        LocalDateTime previousStartTime = appointment.getAppointmentDateTime();
        appointment.setAppointmentDateTime(request.startTime());
        Appointment saved = appointmentRepository.save(appointment);

        auditLogService.log("APPOINTMENT_RESCHEDULED", currentUserEmail(),
                "Rescheduled appointment id=" + saved.getId() + " from=" + previousStartTime
                        + " to=" + request.startTime());

        return toResponse(saved);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<AppointmentResponseDto> searchAppointments(Long doctorId, Long patientId, LocalDate startDate,
                                                             LocalDate endDate, Appointment.Status status) {
        Long effectiveDoctorId = doctorId;
        if (isDoctorCaller()) {
            Doctor ownDoctor = doctorRepository.findByUserEmail(currentUserEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("No doctor profile linked to this account"));
            effectiveDoctorId = ownDoctor.getId();
        }

        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime end = endDate != null ? endDate.plusDays(1).atStartOfDay() : null;

        Specification<Appointment> specification =
                buildSearchSpecification(effectiveDoctorId, patientId, start, end, status);

        return appointmentRepository.findAll(specification).stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Builds a query that only constrains on the filters actually supplied,
     * avoiding a PostgreSQL/JDBC parameter-type-inference error that a plain
     * JPQL "field = :x OR :x IS NULL" pattern hits for a bare null parameter.
     */
    private Specification<Appointment> buildSearchSpecification(Long doctorId, Long patientId, LocalDateTime start,
                                                                  LocalDateTime end, Appointment.Status status) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (doctorId != null) {
                predicates.add(criteriaBuilder.equal(root.get("doctor").get("id"), doctorId));
            }
            if (patientId != null) {
                predicates.add(criteriaBuilder.equal(root.get("patient").get("id"), patientId));
            }
            if (start != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("appointmentDateTime"), start));
            }
            if (end != null) {
                predicates.add(criteriaBuilder.lessThan(root.get("appointmentDateTime"), end));
            }
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Ensures the doctor is currently active and can accept new bookings.
     */
    private void assertDoctorActive(Doctor doctor) {
        if (doctor.getStatus() != Doctor.Status.ACTIVE) {
            throw new IllegalArgumentException("Doctor is not active and cannot be booked");
        }
    }

    /**
     * Ensures the requested [startTime, endTime) range falls entirely within one
     * of the doctor's availability windows for that date.
     */
    private void assertWithinAvailability(Long doctorId, LocalDateTime startTime, LocalDateTime endTime) {
        LocalDate date = startTime.toLocalDate();
        List<DoctorAvailability> windows = doctorAvailabilityRepository.findByDoctorIdAndDate(doctorId, date);

        boolean withinWindow = windows.stream().anyMatch(window ->
                !startTime.toLocalTime().isBefore(window.getStartTime())
                        && !endTime.toLocalTime().isAfter(window.getEndTime()));

        if (!withinWindow) {
            throw new IllegalArgumentException("Requested time is outside the doctor's availability");
        }
    }

    /**
     * Ensures the requested range does not overlap any existing, non-cancelled
     * appointment for the doctor, other than the one being rescheduled (if any).
     * Existing appointments are treated as occupying a fixed slot of
     * SLOT_MINUTES starting at their stored time, matching the assumption used
     * when listing free slots.
     */
    private void assertNoConflict(Long doctorId, LocalDateTime startTime, LocalDateTime endTime,
                                   Long excludeAppointmentId) {
        LocalDate date = startTime.toLocalDate();
        List<Appointment> existingAppointments = appointmentRepository
                .findByDoctorIdAndAppointmentDateTimeBetweenAndStatusNot(
                        doctorId, date.atStartOfDay(), date.plusDays(1).atStartOfDay(), Appointment.Status.CANCELED);

        boolean overlaps = existingAppointments.stream()
                .filter(appointment -> excludeAppointmentId == null || !appointment.getId().equals(excludeAppointmentId))
                .anyMatch(appointment -> {
                    LocalDateTime existingStart = appointment.getAppointmentDateTime();
                    LocalDateTime existingEnd = existingStart.plusMinutes(SLOT_MINUTES);
                    return startTime.isBefore(existingEnd) && existingStart.isBefore(endTime);
                });

        if (overlaps) {
            throw new AppointmentConflictException("The doctor already has an appointment overlapping this time range");
        }
    }

    /**
     * Allows the operation when the caller is ADMIN or RECEPTIONIST, or is the
     * DOCTOR assigned to this specific appointment.
     */
    private void assertAdminReceptionistOrOwningDoctor(Appointment appointment) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isPrivileged = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(ADMIN_AUTHORITY)
                        || authority.getAuthority().equals(RECEPTIONIST_AUTHORITY));
        if (isPrivileged) {
            return;
        }
        if (!appointment.getDoctor().getUser().getEmail().equals(authentication.getName())) {
            throw new AccessDeniedException("You do not have access to this appointment");
        }
    }

    private boolean isDoctorCaller() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(DOCTOR_AUTHORITY));
    }

    private Appointment getAppointmentOrThrow(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
    }

    private AppointmentResponseDto toResponse(Appointment appointment) {
        return new AppointmentResponseDto(
                appointment.getId(),
                appointment.getDoctor().getId(),
                appointment.getPatient().getId(),
                appointment.getAppointmentDateTime(),
                appointment.getStatus().name()
        );
    }

    private String currentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
