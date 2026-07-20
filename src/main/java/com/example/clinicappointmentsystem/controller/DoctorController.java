// src/main/java/com/example/clinicappointmentsystem/controller/DoctorController.java
package com.example.clinicappointmentsystem.controller;

import com.example.clinicappointmentsystem.dto.DoctorRequest;
import com.example.clinicappointmentsystem.dto.DoctorResponse;
import com.example.clinicappointmentsystem.dto.DoctorStatusRequest;
import com.example.clinicappointmentsystem.dto.TimeSlotResponse;
import com.example.clinicappointmentsystem.service.DoctorAvailabilityService;
import com.example.clinicappointmentsystem.service.DoctorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Exposes CRUD endpoints for doctor profiles, plus a free-slot availability lookup.
 */
@RestController
@RequestMapping("/api/v1/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;
    private final DoctorAvailabilityService doctorAvailabilityService;

    /**
     * Lists all doctors. Available to any authenticated role.
     */
    @GetMapping
    public List<DoctorResponse> findAll() {
        return doctorService.findAll();
    }

    /**
     * Retrieves a single doctor by id. Available to any authenticated role.
     */
    @GetMapping("/{id}")
    public DoctorResponse findById(@PathVariable Long id) {
        return doctorService.findById(id);
    }

    /**
     * Creates a doctor profile linked to an existing user account. ADMIN only.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DoctorResponse> create(@Valid @RequestBody DoctorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(doctorService.create(request));
    }

    /**
     * Updates a doctor profile. ADMIN only.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public DoctorResponse update(@PathVariable Long id, @Valid @RequestBody DoctorRequest request) {
        return doctorService.update(id, request);
    }

    /**
     * Deletes a doctor profile. ADMIN only.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        doctorService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Flips a doctor's bookable status (ACTIVE/INACTIVE). ADMIN only. Status
     * changes only ever happen through this endpoint, never through the
     * general create/update payload.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public DoctorResponse updateStatus(@PathVariable Long id, @Valid @RequestBody DoctorStatusRequest request) {
        return doctorService.updateStatus(id, request.status());
    }

    /**
     * Returns a doctor's free appointment slots for a given date, derived from
     * their availability windows minus already-booked, non-cancelled appointments.
     * Available to any authenticated role.
     */
    @GetMapping("/{id}/availability")
    public List<TimeSlotResponse> findAvailability(@PathVariable Long id,
                                                     @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return doctorAvailabilityService.findFreeSlots(id, date);
    }
}
