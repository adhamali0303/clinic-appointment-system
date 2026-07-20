// src/main/java/com/example/clinicappointmentsystem/dto/DoctorRequest.java
package com.example.clinicappointmentsystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Payload for creating or updating a doctor profile linked to an existing user account.
 *
 * @param userId    id of the {@code User} (with role DOCTOR) this profile belongs to
 * @param specialty the doctor's medical specialty
 */
public record DoctorRequest(
        @NotNull Long userId,
        @NotBlank String specialty
) {
}
