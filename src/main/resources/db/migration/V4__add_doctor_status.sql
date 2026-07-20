-- Adds an active/inactive flag to doctors so appointment booking can reject
-- an inactive doctor. Existing rows backfill to ACTIVE.
ALTER TABLE doctors
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
