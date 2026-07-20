// src/main/java/com/example/clinicappointmentsystem/dto/DoctorStatusRequest.java
package com.example.clinicappointmentsystem.dto;

import com.example.clinicappointmentsystem.model.Doctor;
import jakarta.validation.constraints.NotNull;

/**
 * Payload for flipping a doctor's bookable status.
 *
 * @param status the new status (ACTIVE or INACTIVE)
 */
public record DoctorStatusRequest(
        @NotNull Doctor.Status status
) {
}
