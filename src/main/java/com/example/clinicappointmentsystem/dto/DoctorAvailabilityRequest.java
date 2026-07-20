// src/main/java/com/example/clinicappointmentsystem/dto/DoctorAvailabilityRequest.java
package com.example.clinicappointmentsystem.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Payload for creating or updating a doctor's availability window.
 *
 * @param doctorId  id of the doctor this window belongs to
 * @param date      the calendar date this window applies to
 * @param startTime the window's start time
 * @param endTime   the window's end time
 */
public record DoctorAvailabilityRequest(
        @NotNull Long doctorId,
        @NotNull LocalDate date,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime
) {
}
