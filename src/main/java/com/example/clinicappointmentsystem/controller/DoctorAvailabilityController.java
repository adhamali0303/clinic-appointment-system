// src/main/java/com/example/clinicappointmentsystem/controller/DoctorAvailabilityController.java
package com.example.clinicappointmentsystem.controller;

import com.example.clinicappointmentsystem.dto.DoctorAvailabilityRequest;
import com.example.clinicappointmentsystem.dto.DoctorAvailabilityResponse;
import com.example.clinicappointmentsystem.service.DoctorAvailabilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Exposes CRUD endpoints for doctor availability windows.
 */
@RestController
@RequestMapping("/api/v1/availabilities")
@RequiredArgsConstructor
public class DoctorAvailabilityController {

    private final DoctorAvailabilityService doctorAvailabilityService;

    /**
     * Lists all availability windows. Available to any authenticated role.
     */
    @GetMapping
    public List<DoctorAvailabilityResponse> findAll() {
        return doctorAvailabilityService.findAll();
    }

    /**
     * Retrieves a single availability window by id. Available to any authenticated role.
     */
    @GetMapping("/{id}")
    public DoctorAvailabilityResponse findById(@PathVariable Long id) {
        return doctorAvailabilityService.findById(id);
    }

    /**
     * Creates an availability window. Allowed for ADMIN, or the DOCTOR who owns
     * the target doctor profile (ownership is enforced in the service layer).
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<DoctorAvailabilityResponse> create(@Valid @RequestBody DoctorAvailabilityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(doctorAvailabilityService.create(request));
    }

    /**
     * Updates an availability window. Allowed for ADMIN, or the owning DOCTOR.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public DoctorAvailabilityResponse update(@PathVariable Long id,
                                              @Valid @RequestBody DoctorAvailabilityRequest request) {
        return doctorAvailabilityService.update(id, request);
    }

    /**
     * Deletes an availability window. Allowed for ADMIN, or the owning DOCTOR.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        doctorAvailabilityService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
