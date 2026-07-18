// src/main/java/com/example/clinicappointmentsystem/dto/LoginRequest.java
package com.example.clinicappointmentsystem.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Payload for authenticating an existing account.
 *
 * @param email    the account's login email
 * @param password the raw password to verify
 */
public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
) {
}
