// src/main/java/com/example/clinicappointmentsystem/dto/PatientRequest.java
package com.example.clinicappointmentsystem.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Payload for creating or updating a patient record.
 *
 * @param name  the patient's full name
 * @param phone the patient's contact phone number
 * @param email the patient's email, optional but must be a valid address when present
 */
public record PatientRequest(
        @NotBlank String name,
        @NotBlank String phone,
        @Email String email
) {
}
