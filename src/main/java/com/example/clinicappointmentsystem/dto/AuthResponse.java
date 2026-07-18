// src/main/java/com/example/clinicappointmentsystem/dto/AuthResponse.java
package com.example.clinicappointmentsystem.dto;

/**
 * Result of a successful registration or login.
 *
 * @param token the signed JWT to use on subsequent requests
 * @param email the authenticated user's email
 * @param role  the authenticated user's role
 */
public record AuthResponse(
        String token,
        String email,
        String role
) {
}
