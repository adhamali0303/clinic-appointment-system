// src/main/java/com/example/clinicappointmentsystem/exception/ErrorResponse.java
package com.example.clinicappointmentsystem.exception;

import java.time.LocalDateTime;

/**
 * Standard error payload returned by the API for any handled exception.
 *
 * @param timestamp moment the error was handled
 * @param status    HTTP status code
 * @param error     HTTP status reason phrase
 * @param message   detail describing what went wrong
 * @param path      request URI that triggered the error
 */
public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path
) {
}
