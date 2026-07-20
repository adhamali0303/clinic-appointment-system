// src/main/java/com/example/clinicappointmentsystem/exception/GlobalExceptionHandler.java
package com.example.clinicappointmentsystem.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

/**
 * Centralized exception handling for all REST controllers, translating
 * exceptions into a consistent {@link ErrorResponse} payload.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles lookups for entities that do not exist.
     *
     * @param ex      the thrown exception
     * @param request the originating HTTP request
     * @return a 404 response body describing the missing resource
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex,
                                                                  HttpServletRequest request) {
        ErrorResponse body = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    /**
     * Handles invalid, client-supplied request data that fails a business rule
     * (e.g. booking an inactive doctor, a duplicate email, a time outside
     * availability) rather than bean-validation constraints.
     *
     * @param ex      the thrown exception
     * @param request the originating HTTP request
     * @return a 400 response body describing the invalid request
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        ErrorResponse body = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * Handles denied access from @PreAuthorize checks and manual authorization
     * checks (this also covers Spring Security's AuthorizationDeniedException,
     * which extends AccessDeniedException).
     *
     * @param ex      the thrown exception
     * @param request the originating HTTP request
     * @return a 403 response body describing the denial
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        ErrorResponse body = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.FORBIDDEN.value(),
                HttpStatus.FORBIDDEN.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    /**
     * Handles scheduling conflicts, such as a double-booked appointment slot.
     *
     * @param ex      the thrown exception
     * @param request the originating HTTP request
     * @return a 409 response body describing the conflict
     */
    @ExceptionHandler(AppointmentConflictException.class)
    public ResponseEntity<ErrorResponse> handleAppointmentConflict(AppointmentConflictException ex,
                                                                     HttpServletRequest request) {
        ErrorResponse body = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.CONFLICT.value(),
                HttpStatus.CONFLICT.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * Handles a database-level constraint violation, most notably the
     * appointments_no_overlap EXCLUDE constraint (V3 migration) catching a
     * double-booking race that slipped past the application-level overlap
     * check because two requests were validated concurrently before either
     * had committed. Translated to the same 409 shape as the application-level
     * {@link AppointmentConflictException}, since from the caller's point of
     * view it's the same kind of conflict.
     *
     * @param ex      the thrown exception
     * @param request the originating HTTP request
     * @return a 409 response body describing the conflict
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex,
                                                                        HttpServletRequest request) {
        ErrorResponse body = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.CONFLICT.value(),
                HttpStatus.CONFLICT.getReasonPhrase(),
                "The request conflicts with an existing record",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * Fallback handler for any unhandled exception, preventing raw stack traces
     * from leaking to API clients.
     *
     * @param ex      the thrown exception
     * @param request the originating HTTP request
     * @return a 500 response body describing the failure
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, HttpServletRequest request) {
        ErrorResponse body = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
