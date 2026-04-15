ALTER TABLE companies
    ADD COLUMN access_token VARCHAR(64) NULL,
    ADD UNIQUE INDEX uq_companies_access_token (access_token);

UPDATE companies
SET access_token = REPLACE(UUID(), '-', '')
WHERE access_token IS NULL;
