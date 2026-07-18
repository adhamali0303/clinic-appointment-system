// src/main/java/com/example/clinicappointmentsystem/dto/RegisterRequest.java
package com.example.clinicappointmentsystem.dto;

import com.example.clinicappointmentsystem.model.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Payload for creating a new account.
 *
 * @param name     the account holder's display name
 * @param email    the login email, must be unique
 * @param password the raw password, hashed before persistence
 * @param role     the access level to assign to the new account
 */
public record RegisterRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank String password,
        @NotNull User.Role role
) {
}
