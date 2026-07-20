// src/main/java/com/example/clinicappointmentsystem/dto/DoctorAvailabilityResponse.java
package com.example.clinicappointmentsystem.dto;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Doctor availability window projection returned by the API.
 *
 * @param id        availability window id
 * @param doctorId  id of the doctor this window belongs to
 * @param date      the calendar date this window applies to
 * @param startTime the window's start time
 * @param endTime   the window's end time
 */
public record DoctorAvailabilityResponse(
        Long id,
        Long doctorId,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime
) {
}
