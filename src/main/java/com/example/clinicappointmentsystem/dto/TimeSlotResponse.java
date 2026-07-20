// src/main/java/com/example/clinicappointmentsystem/dto/TimeSlotResponse.java
package com.example.clinicappointmentsystem.dto;

import java.time.LocalTime;

/**
 * A single free appointment slot within a doctor's availability window.
 *
 * @param startTime slot start time
 * @param endTime   slot end time
 */
public record TimeSlotResponse(
        LocalTime startTime,
        LocalTime endTime
) {
}
