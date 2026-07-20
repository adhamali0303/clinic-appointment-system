// src/main/java/com/example/clinicappointmentsystem/dto/AppointmentRequestDto.java
package com.example.clinicappointmentsystem.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

/**
 * Payload for booking a new appointment.
 *
 * @param doctorId  id of the doctor to book
 * @param patientId id of the patient being booked
 * @param startTime requested appointment start
 * @param endTime   requested appointment end
 */
public record AppointmentRequestDto(
        @NotNull Long doctorId,
        @NotNull Long patientId,
        @NotNull LocalDateTime startTime,
        @NotNull LocalDateTime endTime
) {
}
