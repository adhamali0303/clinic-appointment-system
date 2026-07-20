// src/main/java/com/example/clinicappointmentsystem/controller/AppointmentController.java
package com.example.clinicappointmentsystem.controller;

import com.example.clinicappointmentsystem.dto.AppointmentRequestDto;
import com.example.clinicappointmentsystem.dto.AppointmentResponseDto;
import com.example.clinicappointmentsystem.model.Appointment;
import com.example.clinicappointmentsystem.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Exposes appointment booking, cancellation, rescheduling, and lookup endpoints.
 */
@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    /**
     * Books a new appointment. Allowed for ADMIN, RECEPTIONIST, and DOCTOR roles.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECEPTIONIST') or hasRole('DOCTOR')")
    public ResponseEntity<AppointmentResponseDto> book(@Valid @RequestBody AppointmentRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.bookAppointment(request));
    }

    /**
     * Soft-cancels an appointment. Allowed for ADMIN, RECEPTIONIST, or the
     * DOCTOR assigned to this appointment (ownership enforced in the service layer).
     */
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECEPTIONIST') or hasRole('DOCTOR')")
    public AppointmentResponseDto cancel(@PathVariable Long id) {
        return appointmentService.cancelAppointment(id);
    }

    /**
     * Reschedules an appointment to a new time. Allowed for ADMIN, RECEPTIONIST,
     * or the DOCTOR assigned to this appointment (ownership enforced in the service layer).
     */
    @PatchMapping("/{id}/reschedule")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECEPTIONIST') or hasRole('DOCTOR')")
    public AppointmentResponseDto reschedule(@PathVariable Long id, @Valid @RequestBody AppointmentRequestDto request) {
        return appointmentService.rescheduleAppointment(id, request);
    }

    /**
     * Lists appointments matching the given optional filters. Available to any
     * authenticated role; a DOCTOR caller is always restricted to their own
     * appointments regardless of the doctorId filter passed.
     */
    @GetMapping
    public List<AppointmentResponseDto> search(@RequestParam(required = false) Long doctorId,
                                                @RequestParam(required = false) Long patientId,
                                                @RequestParam(required = false)
                                                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                @RequestParam(required = false)
                                                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                                                @RequestParam(required = false) Appointment.Status status) {
        return appointmentService.searchAppointments(doctorId, patientId, startDate, endDate, status);
    }
}
