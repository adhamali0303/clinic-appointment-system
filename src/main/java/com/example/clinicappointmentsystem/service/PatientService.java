// src/main/java/com/example/clinicappointmentsystem/service/PatientService.java
package com.example.clinicappointmentsystem.service;

import com.example.clinicappointmentsystem.dto.PatientRequest;
import com.example.clinicappointmentsystem.dto.PatientResponse;
import com.example.clinicappointmentsystem.exception.ResourceNotFoundException;
import com.example.clinicappointmentsystem.model.Patient;
import com.example.clinicappointmentsystem.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Manages patient records.
 */
@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final AuditLogService auditLogService;

    /**
     * Lists every patient record.
     */
    public List<PatientResponse> findAll() {
        return patientRepository.findAll().stream().map(this::toResponse).toList();
    }

    /**
     * Retrieves a single patient record by id.
     *
     * @throws ResourceNotFoundException if no patient has that id
     */
    public PatientResponse findById(Long id) {
        return toResponse(getPatientOrThrow(id));
    }

    /**
     * Creates a patient record, and records the change.
     */
    public PatientResponse create(PatientRequest request) {
        Patient patient = Patient.builder()
                .name(request.name())
                .phone(request.phone())
                .email(request.email())
                .build();
        Patient saved = patientRepository.save(patient);

        auditLogService.log("PATIENT_CREATED", currentUserEmail(), "Created patient id=" + saved.getId());
        return toResponse(saved);
    }

    /**
     * Updates a patient record, and records the change.
     *
     * @throws ResourceNotFoundException if no patient has that id
     */
    public PatientResponse update(Long id, PatientRequest request) {
        Patient patient = getPatientOrThrow(id);
        patient.setName(request.name());
        patient.setPhone(request.phone());
        patient.setEmail(request.email());
        Patient saved = patientRepository.save(patient);

        auditLogService.log("PATIENT_UPDATED", currentUserEmail(), "Updated patient id=" + saved.getId());
        return toResponse(saved);
    }

    /**
     * Deletes a patient record, and records the change.
     *
     * @throws ResourceNotFoundException if no patient has that id
     */
    public void delete(Long id) {
        Patient patient = getPatientOrThrow(id);
        patientRepository.delete(patient);
        auditLogService.log("PATIENT_DELETED", currentUserEmail(), "Deleted patient id=" + id);
    }

    private Patient getPatientOrThrow(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + id));
    }

    private PatientResponse toResponse(Patient patient) {
        return new PatientResponse(patient.getId(), patient.getName(), patient.getPhone(), patient.getEmail());
    }

    private String currentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
