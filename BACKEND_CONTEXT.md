# Backend Context — Clinic Appointment System

Reference for frontend integration. Generated from the Spring Boot backend source. Keep in sync if the API changes.

## Base URL

`http://localhost:8080` (default port, no `server.port` override in `application.properties`).

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI spec: `http://localhost:8080/v3/api-docs`

## JWT Auth Flow

1. Obtain a token from `POST /api/v1/auth/register` or `POST /api/v1/auth/login` - both return `{ token, email, role }`.
2. Attach it to every subsequent request as:
   `Authorization: Bearer <token>`
3. Token expiry: `jwt.expiration-ms` = 86400000 ms (24h), configured in `application.properties`.
4. Public, no-token-required paths: `/api/v1/auth/**`, `/swagger-ui/**`, `/v3/api-docs/**`, `/swagger-ui.html`. Every other endpoint requires the header; a missing/invalid token returns 403.

## Roles

Defined in `User.Role`: `ADMIN`, `RECEPTIONIST`, `DOCTOR`. A user has exactly one role (not a set).

- **ADMIN**: full access - manage doctors, patients, availability windows, and appointments for anyone.
- **RECEPTIONIST**: manage patients (create/update/delete) and appointments (book/cancel/reschedule for anyone). View-only on doctors and availability windows - cannot create/update/delete either.
- **DOCTOR**: view-only on doctors and patients. Can create/update/delete availability windows only for their own doctor profile (ownership checked server-side). Can book appointments, and cancel/reschedule only appointments assigned to them. `GET /appointments` is always forced to their own appointments regardless of any `doctorId` filter passed.

## Error Shape

All handled errors return this shape (`ErrorResponse`):

```json
{ "timestamp": "...", "status": 404, "error": "Not Found", "message": "...", "path": "/api/v1/..." }
```

| Status | Meaning |
|---|---|
| 400 | Business-rule validation failure (duplicate email, inactive doctor, time outside availability window) |
| 403 | Missing/invalid token, or role/ownership check failed |
| 404 | Referenced resource does not exist |
| 409 | Appointment time conflict - either the app-level overlap check or the Postgres EXCLUDE constraint caught a double-booking; same response shape either way |
| 500 | Unhandled/unexpected error |

## Endpoints

### Auth (/api/v1/auth) - public

| Method | Path | Role | Request Body | Response |
|---|---|---|---|---|
| POST | /register | none (public) | RegisterRequest{name, email, password, role} | 201 AuthResponse{token, email, role} |
| POST | /login | none (public) | LoginRequest{email, password} | 200 AuthResponse{token, email, role} |

Note: RegisterRequest.role must be one of ADMIN/RECEPTIONIST/DOCTOR. The response does not include the new user's numeric id - there is currently no endpoint to look a user up by email either.

### Doctors (/api/v1/doctors)

| Method | Path | Role | Request Body | Response |
|---|---|---|---|---|
| GET | / | any authenticated | - | 200 List of DoctorResponse |
| GET | /{id} | any authenticated | - | 200 DoctorResponse |
| POST | / | ADMIN | DoctorRequest{userId, specialty} | 201 DoctorResponse |
| PUT | /{id} | ADMIN | DoctorRequest{userId, specialty} | 200 DoctorResponse |
| DELETE | /{id} | ADMIN | - | 204 |
| PATCH | /{id}/status | ADMIN | DoctorStatusRequest{status} | 200 DoctorResponse |
| GET | /{id}/availability?date=YYYY-MM-DD | any authenticated | - | 200 List of TimeSlotResponse{startTime, endTime} |

DoctorResponse: {id, userId, name, email, specialty, status}. DoctorRequest.userId must reference an existing User (no server-side check that its role is DOCTOR). status is one of ACTIVE/INACTIVE (see below) - it is read-only via DoctorRequest; only PATCH /{id}/status changes it.

Doctors have a status (ACTIVE/INACTIVE, defaults to ACTIVE on creation) that gates booking - a booking against an INACTIVE doctor returns 400. DoctorStatusRequest.status must be exactly "ACTIVE" or "INACTIVE". This PATCH is logged to the audit trail as action "DOCTOR_STATUS_UPDATED".

### Patients (/api/v1/patients)

| Method | Path | Role | Request Body | Response |
|---|---|---|---|---|
| GET | / | any authenticated | - | 200 List of PatientResponse |
| GET | /{id} | any authenticated | - | 200 PatientResponse |
| POST | / | ADMIN, RECEPTIONIST | PatientRequest{name, phone, email} | 201 PatientResponse |
| PUT | /{id} | ADMIN, RECEPTIONIST | PatientRequest{name, phone, email} | 200 PatientResponse |
| DELETE | /{id} | ADMIN, RECEPTIONIST | - | 204 |

PatientResponse: {id, name, phone, email}. email is optional (nullable) but must be a valid address when present.

### Doctor Availability (/api/v1/availabilities)

| Method | Path | Role | Request Body | Response |
|---|---|---|---|---|
| GET | / | any authenticated | - | 200 List of DoctorAvailabilityResponse |
| GET | /{id} | any authenticated | - | 200 DoctorAvailabilityResponse |
| POST | / | ADMIN, or the DOCTOR who owns doctorId | DoctorAvailabilityRequest{doctorId, date, startTime, endTime} | 201 DoctorAvailabilityResponse |
| PUT | /{id} | ADMIN, or the owning DOCTOR | DoctorAvailabilityRequest{doctorId, date, startTime, endTime} | 200 DoctorAvailabilityResponse |
| DELETE | /{id} | ADMIN, or the owning DOCTOR | - | 204 |

DoctorAvailabilityResponse: {id, doctorId, date, startTime, endTime}. date is YYYY-MM-DD, startTime/endTime are HH:mm:ss.

### Appointments (/api/v1/appointments)

| Method | Path | Role | Request Body | Response |
|---|---|---|---|---|
| POST | / | ADMIN, RECEPTIONIST, DOCTOR | AppointmentRequestDto{doctorId, patientId, startTime, endTime} | 201 AppointmentResponseDto |
| PATCH | /{id}/cancel | ADMIN, RECEPTIONIST, or the assigned DOCTOR | - | 200 AppointmentResponseDto (status CANCELED) |
| PATCH | /{id}/reschedule | ADMIN, RECEPTIONIST, or the assigned DOCTOR | AppointmentRequestDto{doctorId, patientId, startTime, endTime} | 200 AppointmentResponseDto |
| GET | /?doctorId=&patientId=&startDate=&endDate=&status= | any authenticated (DOCTOR forced to own appointments) | - | 200 List of AppointmentResponseDto |

AppointmentResponseDto: {id, doctorId, patientId, appointmentDateTime, status}. status is one of SCHEDULED, COMPLETED, CANCELED.

startTime/endTime in AppointmentRequestDto are full ISO-8601 local date-times without timezone offset, e.g. "2027-04-01T09:00:00" - not just a date or just a time.

Reschedule note: AppointmentRequestDto.doctorId/patientId are still required fields on the reschedule request (bean validation), but they are ignored - reschedule only ever updates the appointment's time, never its doctor or patient. Send the appointment's existing doctorId/patientId back to satisfy validation.

Search filters on GET /appointments: startDate/endDate are calendar dates (YYYY-MM-DD), inclusive of startDate and exclusive of the day after endDate. All filters are optional and combine with AND.

### Audit Log (/api/v1/audit-logs)

| Method | Path | Role | Request Body | Response |
|---|---|---|---|---|
| GET | /?action=&limit= | ADMIN | - | 200 List of AuditLogResponse{id, action, performedBy, timestamp, details} |

Every create/update/delete on Doctors (including status changes), Patients, Availability, and Appointments (book/cancel/reschedule) is recorded server-side (AuditLogService writes to the audit_log table: action, performedBy email, timestamp, details) and is now readable via this endpoint.

Results are ordered by timestamp descending (most recent first). Both query params are optional and combine with AND: `action` filters to an exact action-code match; `limit` caps the number of rows returned and defaults to 20 if omitted or non-positive.

Action codes currently written: `DOCTOR_CREATED`, `DOCTOR_UPDATED`, `DOCTOR_DELETED`, `DOCTOR_STATUS_UPDATED`, `PATIENT_CREATED`, `PATIENT_UPDATED`, `PATIENT_DELETED`, `AVAILABILITY_CREATED`, `AVAILABILITY_UPDATED`, `AVAILABILITY_DELETED`, `APPOINTMENT_BOOKED`, `APPOINTMENT_CANCELLED`, `APPOINTMENT_RESCHEDULED`.

## Key Business Rules for the Frontend

- Slot picker: call GET /doctors/{id}/availability?date=YYYY-MM-DD to get free slots - this already subtracts booked (non-cancelled) appointments from the doctor's availability windows. Use one of the returned {startTime, endTime} pairs directly when building the booking request (combine with the same date).
- Fixed 30-minute slot granularity everywhere (availability lookup and conflict checking) - not configurable via the API.
- Booking rejections: outside the doctor's availability window returns 400; doctor inactive returns 400; overlapping an existing non-cancelled appointment returns 409.
- Cancel is a soft delete - the appointment row is kept with status=CANCELED; the freed slot reappears in the availability lookup immediately, with no separate action needed on the availability window itself.
- Reschedule keeps the same appointment id; only the time changes, subject to the same availability/conflict checks as a fresh booking.
- DOCTOR-role visibility: GET /appointments always scopes a DOCTOR caller to their own appointments, even if a different doctorId is passed - do not rely on the doctorId filter to view another doctor's schedule as a DOCTOR user.
- 409 is authoritative regardless of source - a double-booking can be caught either by the app-level check or, under real concurrency, by a Postgres-level constraint; the frontend sees the same 409 shape either way and should treat it as "pick a different slot."
