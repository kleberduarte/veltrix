ALTER TABLE companies
    ADD COLUMN onboarding_token VARCHAR(64) NULL,
    ADD UNIQUE INDEX uq_companies_onboarding_token (onboarding_token);
