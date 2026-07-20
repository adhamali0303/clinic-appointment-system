// src/main/java/com/example/clinicappointmentsystem/service/AppointmentService.java
package com.example.clinicappointmentsystem.service;

import com.example.clinicappointmentsystem.dto.AppointmentRequestDto;
import com.example.clinicappointmentsystem.dto.AppointmentResponseDto;
import com.example.clinicappointmentsystem.model.Appointment;

import java.time.LocalDate;
import java.util.List;

/**
 * Handles appointment booking, cancellation, rescheduling, and lookup business logic.
 */
public interface AppointmentService {

    /**
     * Books a new appointment for a patient with a doctor, after validating
     * the doctor is active, the requested time against the doctor's
     * availability, and checking for scheduling conflicts with existing appointments.
     *
     * @param request the requested doctor, patient, and time range
     * @return the newly created appointment
     */
    AppointmentResponseDto bookAppointment(AppointmentRequestDto request);

    /**
     * Soft-cancels an appointment by marking its status CANCELED. The slot is
     * automatically freed since availability lookup already excludes cancelled
     * appointments.
     *
     * @param appointmentId the appointment to cancel
     * @return the cancelled appointment
     */
    AppointmentResponseDto cancelAppointment(Long appointmentId);

    /**
     * Moves an existing appointment to a new time, reusing the same doctor-active,
     * availability-window, and conflict checks used when booking.
     *
     * @param appointmentId the appointment to reschedule
     * @param request       the new requested time range (doctor/patient fields are ignored)
     * @return the rescheduled appointment
     */
    AppointmentResponseDto rescheduleAppointment(Long appointmentId, AppointmentRequestDto request);

    /**
     * Lists appointments matching any combination of the given filters. A DOCTOR
     * caller is always additionally restricted to their own appointments.
     *
     * @param doctorId  optional doctor id filter
     * @param patientId optional patient id filter
     * @param startDate optional inclusive lower bound on appointment date
     * @param endDate   optional inclusive upper bound on appointment date
     * @param status    optional status filter
     * @return the matching appointments
     */
    List<AppointmentResponseDto> searchAppointments(Long doctorId, Long patientId, LocalDate startDate,
                                                      LocalDate endDate, Appointment.Status status);
}
