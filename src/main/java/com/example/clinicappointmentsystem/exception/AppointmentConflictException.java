// src/main/java/com/example/clinicappointmentsystem/exception/AppointmentConflictException.java
package com.example.clinicappointmentsystem.exception;

/**
 * Thrown when a requested appointment time conflicts with an existing, non-cancelled appointment.
 */
public class AppointmentConflictException extends RuntimeException {

    /**
     * @param message description of the scheduling conflict
     */
    public AppointmentConflictException(String message) {
        super(message);
    }
}
