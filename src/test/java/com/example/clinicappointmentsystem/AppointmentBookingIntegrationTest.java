// src/test/java/com/example/clinicappointmentsystem/AppointmentBookingIntegrationTest.java
package com.example.clinicappointmentsystem;

import com.example.clinicappointmentsystem.model.Doctor;
import com.example.clinicappointmentsystem.model.DoctorAvailability;
import com.example.clinicappointmentsystem.model.Patient;
import com.example.clinicappointmentsystem.model.User;
import com.example.clinicappointmentsystem.repository.DoctorAvailabilityRepository;
import com.example.clinicappointmentsystem.repository.DoctorRepository;
import com.example.clinicappointmentsystem.repository.PatientRepository;
import com.example.clinicappointmentsystem.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test proving double-booking is rejected: the same doctor cannot
 * be booked twice for overlapping time ranges. Runs against the project's
 * existing configured datasource (no Testcontainers dependency is present)
 * and rolls back all changes via @Transactional. Request bodies are built as
 * plain JSON strings rather than via ObjectMapper, since this project's
 * auto-configured Jackson stack is Jackson 3 (tools.jackson.*), not the
 * classic com.fasterxml.jackson.databind.ObjectMapper.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AppointmentBookingIntegrationTest {

    private static final LocalDate APPOINTMENT_DATE = LocalDate.of(2027, 3, 15);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorAvailabilityRepository doctorAvailabilityRepository;

    private Long doctorId;
    private Long patientId;

    /**
     * Seeds a doctor (linked to a fresh user account), a matching availability
     * window, and a patient for the booking requests to reference.
     */
    @BeforeEach
    void setUp() {
        User doctorUser = userRepository.save(User.builder()
                .name("Integration Test Doctor")
                .email("integration-test-doctor@example.com")
                .password("irrelevant-not-used-for-login")
                .role(User.Role.DOCTOR)
                .build());

        Doctor doctor = doctorRepository.save(Doctor.builder()
                .user(doctorUser)
                .specialty("Testing")
                .status(Doctor.Status.ACTIVE)
                .build());
        doctorId = doctor.getId();

        doctorAvailabilityRepository.save(DoctorAvailability.builder()
                .doctor(doctor)
                .date(APPOINTMENT_DATE)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(11, 0))
                .build());

        Patient patient = patientRepository.save(Patient.builder()
                .name("Integration Test Patient")
                .phone("555-0000")
                .email("integration-test-patient@example.com")
                .build());
        patientId = patient.getId();
    }

    private String bookingJson(LocalTime startTime, LocalTime endTime) {
        return """
                {"doctorId": %d, "patientId": %d, "startTime": "%sT%s:00", "endTime": "%sT%s:00"}
                """.formatted(doctorId, patientId, APPOINTMENT_DATE, startTime, APPOINTMENT_DATE, endTime);
    }

    /**
     * The first booking for a time range must succeed; a second, overlapping
     * booking for the same doctor must be rejected with 409 Conflict.
     */
    @Test
    @WithMockUser(username = "integration-test-caller@example.com", roles = "ADMIN")
    void secondOverlappingBookingIsRejectedWithConflict() throws Exception {
        mockMvc.perform(post("/api/v1/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookingJson(LocalTime.of(9, 0), LocalTime.of(9, 30))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SCHEDULED"));

        mockMvc.perform(post("/api/v1/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookingJson(LocalTime.of(9, 15), LocalTime.of(9, 45))))
                .andExpect(status().isConflict());
    }
}
