// src/main/java/com/example/clinicappointmentsystem/service/DoctorService.java
package com.example.clinicappointmentsystem.service;

import com.example.clinicappointmentsystem.dto.DoctorRequest;
import com.example.clinicappointmentsystem.dto.DoctorResponse;
import com.example.clinicappointmentsystem.exception.ResourceNotFoundException;
import com.example.clinicappointmentsystem.model.Doctor;
import com.example.clinicappointmentsystem.model.User;
import com.example.clinicappointmentsystem.repository.DoctorRepository;
import com.example.clinicappointmentsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Manages doctor profiles, each linked one-to-one to a user account.
 */
@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    /**
     * Lists every doctor profile.
     */
    public List<DoctorResponse> findAll() {
        return doctorRepository.findAll().stream().map(this::toResponse).toList();
    }

    /**
     * Retrieves a single doctor profile by id.
     *
     * @throws ResourceNotFoundException if no doctor has that id
     */
    public DoctorResponse findById(Long id) {
        return toResponse(getDoctorOrThrow(id));
    }

    /**
     * Creates a doctor profile linked to an existing user account, and records the change.
     *
     * @throws ResourceNotFoundException if the referenced user does not exist
     */
    public DoctorResponse create(DoctorRequest request) {
        User user = getUserOrThrow(request.userId());

        Doctor doctor = Doctor.builder()
                .user(user)
                .specialty(request.specialty())
                .status(Doctor.Status.ACTIVE)
                .build();
        Doctor saved = doctorRepository.save(doctor);

        auditLogService.log("DOCTOR_CREATED", currentUserEmail(), "Created doctor id=" + saved.getId());
        return toResponse(saved);
    }

    /**
     * Updates a doctor profile's linked user and specialty, and records the change.
     *
     * @throws ResourceNotFoundException if the doctor or the referenced user does not exist
     */
    public DoctorResponse update(Long id, DoctorRequest request) {
        Doctor doctor = getDoctorOrThrow(id);
        User user = getUserOrThrow(request.userId());

        doctor.setUser(user);
        doctor.setSpecialty(request.specialty());
        Doctor saved = doctorRepository.save(doctor);

        auditLogService.log("DOCTOR_UPDATED", currentUserEmail(), "Updated doctor id=" + saved.getId());
        return toResponse(saved);
    }

    /**
     * Deletes a doctor profile, and records the change.
     *
     * @throws ResourceNotFoundException if no doctor has that id
     */
    public void delete(Long id) {
        Doctor doctor = getDoctorOrThrow(id);
        doctorRepository.delete(doctor);
        auditLogService.log("DOCTOR_DELETED", currentUserEmail(), "Deleted doctor id=" + id);
    }

    /**
     * Flips a doctor's bookable status (ACTIVE/INACTIVE), and records the change.
     *
     * @throws ResourceNotFoundException if no doctor has that id
     */
    public DoctorResponse updateStatus(Long id, Doctor.Status status) {
        Doctor doctor = getDoctorOrThrow(id);
        Doctor.Status oldStatus = doctor.getStatus();

        doctor.setStatus(status);
        Doctor saved = doctorRepository.save(doctor);

        auditLogService.log(
                "DOCTOR_STATUS_UPDATED",
                currentUserEmail(),
                "Doctor " + saved.getUser().getName() + " (id=" + saved.getId() + ") status: "
                        + oldStatus + " -> " + status
        );
        return toResponse(saved);
    }

    private Doctor getDoctorOrThrow(Long id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
    }

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    private DoctorResponse toResponse(Doctor doctor) {
        return new DoctorResponse(
                doctor.getId(),
                doctor.getUser().getId(),
                doctor.getUser().getName(),
                doctor.getUser().getEmail(),
                doctor.getSpecialty(),
                doctor.getStatus().name()
        );
    }

    private String currentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
