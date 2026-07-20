// src/main/java/com/example/clinicappointmentsystem/controller/PatientController.java
package com.example.clinicappointmentsystem.controller;

import com.example.clinicappointmentsystem.dto.PatientRequest;
import com.example.clinicappointmentsystem.dto.PatientResponse;
import com.example.clinicappointmentsystem.service.PatientService;
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
 * Exposes CRUD endpoints for patient records.
 */
@RestController
@RequestMapping("/api/v1/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    /**
     * Lists all patients. Available to any authenticated role.
     */
    @GetMapping
    public List<PatientResponse> findAll() {
        return patientService.findAll();
    }

    /**
     * Retrieves a single patient by id. Available to any authenticated role.
     */
    @GetMapping("/{id}")
    public PatientResponse findById(@PathVariable Long id) {
        return patientService.findById(id);
    }

    /**
     * Registers a new patient. Restricted to ADMIN and RECEPTIONIST.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECEPTIONIST')")
    public ResponseEntity<PatientResponse> create(@Valid @RequestBody PatientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(patientService.create(request));
    }

    /**
     * Updates a patient record. Restricted to ADMIN and RECEPTIONIST.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECEPTIONIST')")
    public PatientResponse update(@PathVariable Long id, @Valid @RequestBody PatientRequest request) {
        return patientService.update(id, request);
    }

    /**
     * Deletes a patient record. Restricted to ADMIN and RECEPTIONIST.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RECEPTIONIST')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        patientService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
