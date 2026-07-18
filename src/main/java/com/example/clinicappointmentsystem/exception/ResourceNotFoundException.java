// src/main/java/com/example/clinicappointmentsystem/exception/ResourceNotFoundException.java
package com.example.clinicappointmentsystem.exception;

/**
 * Thrown when a requested domain entity cannot be found.
 */
public class ResourceNotFoundException extends RuntimeException {

    /**
     * @param message description of which resource was missing
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
