-- Required so the EXCLUDE constraint below can mix a plain equality check
-- (doctor_id) with a GiST range-overlap check in the same index.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Note: unlike V1/V2, this migration keeps the standard .sql suffix so Flyway
-- (spring.flyway.sql-migration-suffixes defaults to .sql) actually discovers
-- and applies it; the extensionless V1/V2 files are silently skipped by Flyway
-- and only ever took effect via hibernate.ddl-auto=update.
--
-- Database-level safety net against double-booking: rejects any INSERT/UPDATE
-- that would give the same doctor two non-cancelled appointments with
-- overlapping time ranges, closing the race-condition window the
-- application-level overlap check (AppointmentServiceImpl) can't fully cover.
-- appointment_date_time has no paired end-time column, so each appointment is
-- treated as occupying a fixed 30-minute block from its start, matching the
-- same assumption already used throughout the application logic. tsrange (not
-- tstzrange) is used because appointment_date_time is TIMESTAMP WITHOUT TIME ZONE.
ALTER TABLE appointments
    ADD CONSTRAINT appointments_no_overlap
    EXCLUDE USING gist (
        doctor_id WITH =,
        tsrange(appointment_date_time, appointment_date_time + interval '30 minutes') WITH &&
    )
    WHERE (status <> 'CANCELED');
