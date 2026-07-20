// src/main/java/com/example/clinicappointmentsystem/dto/PatientResponse.java
package com.example.clinicappointmentsystem.dto;

/**
 * Patient record projection returned by the API.
 *
 * @param id    patient id
 * @param name  the patient's full name
 * @param phone the patient's contact phone number
 * @param email the patient's email, if any
 */
public record PatientResponse(
        Long id,
        String name,
        String phone,
        String email
) {
}
