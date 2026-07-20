// src/test/java/com/example/clinicappointmentsystem/AppointmentBookingConcurrencyIntegrationTest.java
package com.example.clinicappointmentsystem;

import com.example.clinicappointmentsystem.model.Doctor;
import com.example.clinicappointmentsystem.model.DoctorAvailability;
import com.example.clinicappointmentsystem.model.Patient;
import com.example.clinicappointmentsystem.model.User;
import com.example.clinicappointmentsystem.repository.AppointmentRepository;
import com.example.clinicappointmentsystem.repository.DoctorAvailabilityRepository;
import com.example.clinicappointmentsystem.repository.DoctorRepository;
import com.example.clinicappointmentsystem.repository.PatientRepository;
import com.example.clinicappointmentsystem.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * Proves the database-level safety net (the appointments_no_overlap EXCLUDE
 * constraint from the V3 migration) rejects a double-booking that happens
 * under genuine concurrency, not just sequentially.
 * <p>
 * {@link AppointmentBookingIntegrationTest#secondOverlappingBookingIsRejectedWithConflict()}
 * only proves the application-level overlap check in AppointmentServiceImpl
 * works, because it sends the two requests one after another: the first
 * request's booking is fully committed before the second request's overlap
 * check even runs, so the application-level check alone is sufficient to
 * catch it. That says nothing about what happens if two requests both pass
 * their overlap check before either has committed — the actual race window
 * the EXCLUDE constraint exists to close.
 * <p>
 * This class deliberately has no class-level @Transactional. If it did, the
 * @BeforeEach setup (doctor/availability/patient) would remain uncommitted
 * until the test method finished, and Postgres (under READ COMMITTED) would
 * hide that data from the separate connections the two concurrent worker
 * threads use, so neither request could even find the doctor. Worse, wrapping
 * the two concurrent attempts in one shared transaction would serialize them
 * onto a single connection and defer any constraint check to a final commit
 * that never truly happens mid-test, which is exactly what this test must
 * avoid to prove the constraint is enforced during the concurrent attempt
 * itself. Each MockMvc-dispatched request here runs on its own worker thread,
 * so (via spring.jpa.open-in-view) each gets its own EntityManager/connection
 * and its own real, immediately-committing transaction per repository call —
 * genuine concurrent access to the same row range.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AppointmentBookingConcurrencyIntegrationTest {

    private static final LocalDate APPOINTMENT_DATE = LocalDate.of(2027, 9, 1);
    private static final String CALLER_EMAIL = "concurrency-test-caller@example.com";
    private static final Pattern ID_PATTERN = Pattern.compile("\"id\":(\\d+)");

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

    @Autowired
    private AppointmentRepository appointmentRepository;

    private Long userId;
    private Long doctorId;
    private Long availabilityId;
    private Long patientId;

    /**
     * Seeds and immediately commits a doctor, availability window, and patient
     * (no surrounding transaction here to defer that commit), so both
     * concurrent worker threads' own connections can see them.
     */
    @BeforeEach
    void setUp() {
        User doctorUser = userRepository.save(User.builder()
                .name("Concurrency Test Doctor")
                .email("concurrency-test-doctor@example.com")
                .password("irrelevant-not-used-for-login")
                .role(User.Role.DOCTOR)
                .build());
        userId = doctorUser.getId();

        Doctor doctor = doctorRepository.save(Doctor.builder()
                .user(doctorUser)
                .specialty("Testing")
                .status(Doctor.Status.ACTIVE)
                .build());
        doctorId = doctor.getId();

        DoctorAvailability availability = doctorAvailabilityRepository.save(DoctorAvailability.builder()
                .doctor(doctor)
                .date(APPOINTMENT_DATE)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(11, 0))
                .build());
        availabilityId = availability.getId();

        Patient patient = patientRepository.save(Patient.builder()
                .name("Concurrency Test Patient")
                .phone("555-2222")
                .email("concurrency-test-patient@example.com")
                .build());
        patientId = patient.getId();
    }

    private final List<Long> createdAppointmentIds = new ArrayList<>();

    /**
     * Explicit cleanup, since without @Transactional nothing here rolls back
     * automatically: deletes any appointment(s) created by the test, then the
     * availability window, doctor, patient, and user seeded in setUp.
     */
    @AfterEach
    void tearDown() {
        createdAppointmentIds.forEach(appointmentRepository::deleteById);
        doctorAvailabilityRepository.deleteById(availabilityId);
        doctorRepository.deleteById(doctorId);
        patientRepository.deleteById(patientId);
        userRepository.deleteById(userId);
    }

    private String bookingJson() {
        return """
                {"doctorId": %d, "patientId": %d, "startTime": "%sT09:00:00", "endTime": "%sT09:30:00"}
                """.formatted(doctorId, patientId, APPOINTMENT_DATE, APPOINTMENT_DATE);
    }

    private Long extractId(String responseBody) {
        Matcher matcher = ID_PATTERN.matcher(responseBody);
        return matcher.find() ? Long.parseLong(matcher.group(1)) : null;
    }

    /**
     * Fires two identical booking requests from two threads released at the
     * same instant via a CyclicBarrier, so both pass the application-level
     * overlap check before either has committed. Exactly one must end up
     * booked; the other must be rejected as a conflict, whether the
     * rejection comes from the application-level check (AppointmentConflictException)
     * or, if both threads raced past that check, from the appointments_no_overlap
     * database constraint (surfaced as DataIntegrityViolationException, now
     * mapped to the same 409 in GlobalExceptionHandler).
     */
    @Test
    void concurrentIdenticalBookingsResultInExactlyOneSuccess() throws Exception {
        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CyclicBarrier barrier = new CyclicBarrier(threadCount);

        Callable<MvcResult> bookingTask = () -> {
            barrier.await(10, TimeUnit.SECONDS);
            return mockMvc.perform(post("/api/v1/appointments")
                            .with(SecurityMockMvcRequestPostProcessors.user(CALLER_EMAIL).roles("ADMIN"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(bookingJson()))
                    .andReturn();
        };

        List<Future<MvcResult>> futures = new ArrayList<>();
        for (int i = 0; i < threadCount; i++) {
            futures.add(executor.submit(bookingTask));
        }

        List<Integer> statuses = new ArrayList<>();
        for (Future<MvcResult> future : futures) {
            MvcResult result = future.get(15, TimeUnit.SECONDS);
            int status = result.getResponse().getStatus();
            statuses.add(status);
            if (status == 201) {
                createdAppointmentIds.add(extractId(result.getResponse().getContentAsString()));
            }
        }
        executor.shutdown();

        long successCount = statuses.stream().filter(status -> status == 201).count();
        long conflictCount = statuses.stream().filter(status -> status == 409).count();

        assertEquals(1, successCount, "expected exactly one booking to succeed, got statuses: " + statuses);
        assertEquals(1, conflictCount, "expected exactly one booking to be rejected as a conflict, got statuses: " + statuses);
    }
}
