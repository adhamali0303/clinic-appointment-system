// src/main/java/com/example/clinicappointmentsystem/service/DoctorAvailabilityService.java
package com.example.clinicappointmentsystem.service;

import com.example.clinicappointmentsystem.dto.DoctorAvailabilityRequest;
import com.example.clinicappointmentsystem.dto.DoctorAvailabilityResponse;
import com.example.clinicappointmentsystem.dto.TimeSlotResponse;
import com.example.clinicappointmentsystem.exception.ResourceNotFoundException;
import com.example.clinicappointmentsystem.model.Appointment;
import com.example.clinicappointmentsystem.model.Doctor;
import com.example.clinicappointmentsystem.model.DoctorAvailability;
import com.example.clinicappointmentsystem.repository.AppointmentRepository;
import com.example.clinicappointmentsystem.repository.DoctorAvailabilityRepository;
import com.example.clinicappointmentsystem.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Manages doctor availability windows and computes free appointment slots from them.
 */
@Service
@RequiredArgsConstructor
public class DoctorAvailabilityService {

    private static final int SLOT_MINUTES = 30;
    private static final String ADMIN_AUTHORITY = "ROLE_ADMIN";

    private final DoctorAvailabilityRepository doctorAvailabilityRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final AuditLogService auditLogService;

    /**
     * Lists every availability window.
     */
    public List<DoctorAvailabilityResponse> findAll() {
        return doctorAvailabilityRepository.findAll().stream().map(this::toResponse).toList();
    }

    /**
     * Retrieves a single availability window by id.
     *
     * @throws ResourceNotFoundException if no window has that id
     */
    public DoctorAvailabilityResponse findById(Long id) {
        return toResponse(getAvailabilityOrThrow(id));
    }

    /**
     * Creates an availability window for a doctor. Restricted to ADMIN or the
     * doctor the window belongs to, and records the change.
     *
     * @throws ResourceNotFoundException if the referenced doctor does not exist
     * @throws AccessDeniedException if the caller is neither ADMIN nor that doctor
     */
    public DoctorAvailabilityResponse create(DoctorAvailabilityRequest request) {
        Doctor doctor = getDoctorOrThrow(request.doctorId());
        assertAdminOrOwner(doctor);

        DoctorAvailability availability = DoctorAvailability.builder()
                .doctor(doctor)
                .date(request.date())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .build();
        DoctorAvailability saved = doctorAvailabilityRepository.save(availability);

        auditLogService.log("AVAILABILITY_CREATED", currentUserEmail(), "Created availability id=" + saved.getId());
        return toResponse(saved);
    }

    /**
     * Updates an availability window. Restricted to ADMIN or the doctor the
     * window belongs to, and records the change.
     *
     * @throws ResourceNotFoundException if the window or the referenced doctor does not exist
     * @throws AccessDeniedException if the caller is neither ADMIN nor that doctor
     */
    public DoctorAvailabilityResponse update(Long id, DoctorAvailabilityRequest request) {
        DoctorAvailability availability = getAvailabilityOrThrow(id);
        assertAdminOrOwner(availability.getDoctor());

        Doctor doctor = getDoctorOrThrow(request.doctorId());
        availability.setDoctor(doctor);
        availability.setDate(request.date());
        availability.setStartTime(request.startTime());
        availability.setEndTime(request.endTime());
        DoctorAvailability saved = doctorAvailabilityRepository.save(availability);

        auditLogService.log("AVAILABILITY_UPDATED", currentUserEmail(), "Updated availability id=" + saved.getId());
        return toResponse(saved);
    }

    /**
     * Deletes an availability window. Restricted to ADMIN or the doctor the
     * window belongs to, and records the change.
     *
     * @throws ResourceNotFoundException if no window has that id
     * @throws AccessDeniedException if the caller is neither ADMIN nor that doctor
     */
    public void delete(Long id) {
        DoctorAvailability availability = getAvailabilityOrThrow(id);
        assertAdminOrOwner(availability.getDoctor());

        doctorAvailabilityRepository.delete(availability);
        auditLogService.log("AVAILABILITY_DELETED", currentUserEmail(), "Deleted availability id=" + id);
    }

    /**
     * Computes a doctor's free appointment slots on a given date: each availability
     * window is split into fixed-length slots, and any slot that overlaps a
     * non-cancelled appointment is removed. Existing appointments are treated as
     * occupying a fixed SLOT_MINUTES block starting at their stored time.
     *
     * @throws ResourceNotFoundException if no doctor has that id
     */
    public List<TimeSlotResponse> findFreeSlots(Long doctorId, LocalDate date) {
        if (!doctorRepository.existsById(doctorId)) {
            throw new ResourceNotFoundException("Doctor not found with id: " + doctorId);
        }

        List<DoctorAvailability> windows = doctorAvailabilityRepository.findByDoctorIdAndDate(doctorId, date);

        List<Appointment> bookedAppointments = appointmentRepository
                .findByDoctorIdAndAppointmentDateTimeBetweenAndStatusNot(
                        doctorId, date.atStartOfDay(), date.plusDays(1).atStartOfDay(), Appointment.Status.CANCELED);

        List<TimeSlotResponse> freeSlots = new ArrayList<>();
        for (DoctorAvailability window : windows) {
            LocalTime slotStart = window.getStartTime();
            while (!slotStart.plusMinutes(SLOT_MINUTES).isAfter(window.getEndTime())) {
                LocalTime slotEnd = slotStart.plusMinutes(SLOT_MINUTES);
                if (!overlapsAnyAppointment(date, slotStart, slotEnd, bookedAppointments)) {
                    freeSlots.add(new TimeSlotResponse(slotStart, slotEnd));
                }
                slotStart = slotEnd;
            }
        }
        return freeSlots;
    }

    private boolean overlapsAnyAppointment(LocalDate date, LocalTime slotStart, LocalTime slotEnd,
                                            List<Appointment> bookedAppointments) {
        LocalDateTime slotStartDateTime = date.atTime(slotStart);
        LocalDateTime slotEndDateTime = date.atTime(slotEnd);

        return bookedAppointments.stream().anyMatch(appointment -> {
            LocalDateTime bookedStart = appointment.getAppointmentDateTime();
            LocalDateTime bookedEnd = bookedStart.plusMinutes(SLOT_MINUTES);
            return slotStartDateTime.isBefore(bookedEnd) && bookedStart.isBefore(slotEndDateTime);
        });
    }

    /**
     * Allows the operation when the caller is an ADMIN, or is the DOCTOR linked to the given doctor profile.
     */
    private void assertAdminOrOwner(Doctor doctor) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(ADMIN_AUTHORITY));
        if (isAdmin) {
            return;
        }
        if (!doctor.getUser().getEmail().equals(authentication.getName())) {
            throw new AccessDeniedException("You do not have access to this doctor availability");
        }
    }

    private DoctorAvailability getAvailabilityOrThrow(Long id) {
        return doctorAvailabilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Availability not found with id: " + id));
    }

    private Doctor getDoctorOrThrow(Long doctorId) {
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));
    }

    private DoctorAvailabilityResponse toResponse(DoctorAvailability availability) {
        return new DoctorAvailabilityResponse(
                availability.getId(),
                availability.getDoctor().getId(),
                availability.getDate(),
                availability.getStartTime(),
                availability.getEndTime()
        );
    }

    private String currentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
