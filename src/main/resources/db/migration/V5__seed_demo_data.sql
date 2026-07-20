-- src/main/resources/db/migration/V5__seed_demo_data.sql
-- Seeds local/demo data matching the "Demo Accounts" shown on the frontend
-- login page, plus enough doctors/patients/availability/appointments for the
-- booking wizard and dashboards to have real data on first login. Not
-- intended for a real production database.
--
-- Shared password for every seeded user below: "Password123!"
-- (hashed here with the same BCryptPasswordEncoder, strength 10, that
-- AuthService/SecurityConfig use for registration and login.)
--
-- Availability/appointment dates are relative to CURRENT_DATE rather than
-- fixed literals so the demo data stays "in the future" no matter when this
-- migration actually runs against a fresh database.

INSERT INTO users (name, email, password, role) VALUES
    ('Amara Okafor', 'admin@medclinique.com', '$2a$10$kLjAao1wJtgAOGcdW6TeNeb4XPciG2reseOUOvmSERelePPkTwrJi', 'ADMIN'),
    ('Priya Nandan', 'reception@medclinique.com', '$2a$10$1wucbPMI59JRlb132bBw1ehWw8IhB.AIdbG/weIU1AYXdIxbIAoVW', 'RECEPTIONIST'),
    ('Dr. Sarah Chen', 'doctor@medclinique.com', '$2a$10$Vv2wRhsakT3T8M9.0xi1QuGqP6sj6KiU18skRyXhAks0Ba1c/r3iC', 'DOCTOR'),
    ('Dr. Marcus Bello', 'marcus.bello@medclinique.com', '$2a$10$nHAIXu0nuyHxvM7bSRQLT.HnUNBvZ9QHQZV6nxQSrK24YyFaqsoui', 'DOCTOR'),
    ('Dr. Elena Petrova', 'elena.petrova@medclinique.com', '$2a$10$mcsd7FtuKnAaJpevadJpYeyqtdn6A6vibYY.QPmTWjXhs/oh9cqwS', 'DOCTOR')
ON CONFLICT (email) DO NOTHING;

INSERT INTO doctors (user_id, specialty, status)
SELECT id, 'Cardiology', 'ACTIVE' FROM users WHERE email = 'doctor@medclinique.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO doctors (user_id, specialty, status)
SELECT id, 'Orthopedics', 'ACTIVE' FROM users WHERE email = 'marcus.bello@medclinique.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO doctors (user_id, specialty, status)
SELECT id, 'Pediatrics', 'ACTIVE' FROM users WHERE email = 'elena.petrova@medclinique.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO patients (name, phone, email) VALUES
    ('John Whitfield', '555-0101', 'john.whitfield@example.com'),
    ('Maria Gonzalez', '555-0102', 'maria.gonzalez@example.com'),
    ('David Kim', '555-0103', 'david.kim@example.com'),
    ('Fatima Al-Sayed', '555-0104', 'fatima.alsayed@example.com'),
    ('Robert Nakamura', '555-0105', 'robert.nakamura@example.com')
ON CONFLICT (email) DO NOTHING;

-- Dr. Sarah Chen (Cardiology): today plus three more days this/next week
INSERT INTO doctor_availability (doctor_id, date, start_time, end_time)
SELECT d.id, CURRENT_DATE + offset_days, '08:00:00', '16:00:00'
FROM doctors d
JOIN users u ON u.id = d.user_id
CROSS JOIN (VALUES (0), (1), (3), (7)) AS offsets(offset_days)
WHERE u.email = 'doctor@medclinique.com';

-- Dr. Marcus Bello (Orthopedics)
INSERT INTO doctor_availability (doctor_id, date, start_time, end_time)
SELECT d.id, CURRENT_DATE + offset_days, '08:00:00', '16:00:00'
FROM doctors d
JOIN users u ON u.id = d.user_id
CROSS JOIN (VALUES (1), (2), (5), (9)) AS offsets(offset_days)
WHERE u.email = 'marcus.bello@medclinique.com';

-- Dr. Elena Petrova (Pediatrics)
INSERT INTO doctor_availability (doctor_id, date, start_time, end_time)
SELECT d.id, CURRENT_DATE + offset_days, '08:00:00', '16:00:00'
FROM doctors d
JOIN users u ON u.id = d.user_id
CROSS JOIN (VALUES (2), (4), (6), (10)) AS offsets(offset_days)
WHERE u.email = 'elena.petrova@medclinique.com';

-- A handful of already-booked appointments so the appointments list and
-- dashboards aren't empty on first login. Each falls inside the doctor's
-- seeded availability above.
INSERT INTO appointments (doctor_id, patient_id, appointment_date_time, status)
SELECT d.id, p.id, CURRENT_DATE + TIME '11:00:00', 'SCHEDULED'
FROM doctors d
JOIN users u ON u.id = d.user_id
CROSS JOIN patients p
WHERE u.email = 'doctor@medclinique.com' AND p.email = 'john.whitfield@example.com';

INSERT INTO appointments (doctor_id, patient_id, appointment_date_time, status)
SELECT d.id, p.id, CURRENT_DATE + 2 + TIME '10:30:00', 'SCHEDULED'
FROM doctors d
JOIN users u ON u.id = d.user_id
CROSS JOIN patients p
WHERE u.email = 'marcus.bello@medclinique.com' AND p.email = 'maria.gonzalez@example.com';

INSERT INTO appointments (doctor_id, patient_id, appointment_date_time, status)
SELECT d.id, p.id, CURRENT_DATE + 4 + TIME '09:30:00', 'SCHEDULED'
FROM doctors d
JOIN users u ON u.id = d.user_id
CROSS JOIN patients p
WHERE u.email = 'elena.petrova@medclinique.com' AND p.email = 'david.kim@example.com';
