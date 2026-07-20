// src/main/java/com/example/clinicappointmentsystem/dto/DoctorResponse.java
package com.example.clinicappointmentsystem.dto;

/**
 * Doctor profile projection, including basic identity fields from the linked user account.
 *
 * @param id        doctor id
 * @param userId    id of the linked user account
 * @param name      the linked user's name
 * @param email     the linked user's email
 * @param specialty the doctor's medical specialty
 */
public record DoctorResponse(
        Long id,
        Long userId,
        String name,
        String email,
        String specialty
) {
}
