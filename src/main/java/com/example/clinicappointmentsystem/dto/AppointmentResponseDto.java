// src/main/java/com/example/clinicappointmentsystem/dto/AppointmentResponseDto.java
package com.example.clinicappointmentsystem.dto;

import java.time.LocalDateTime;

/**
 * Booked appointment projection returned by the API.
 *
 * @param id                  appointment id
 * @param doctorId            id of the booked doctor
 * @param patientId           id of the booked patient
 * @param appointmentDateTime the appointment's start date and time
 * @param status              current lifecycle status of the appointment
 */
public record AppointmentResponseDto(
        Long id,
        Long doctorId,
        Long patientId,
        LocalDateTime appointmentDateTime,
        String status
) {
}
