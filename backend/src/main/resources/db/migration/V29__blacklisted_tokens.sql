CREATE TABLE IF NOT EXISTS blacklisted_tokens (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    jti        VARCHAR(36)  NOT NULL,
    expires_at DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY idx_blacklisted_jti (jti),
    INDEX idx_blacklisted_expires (expires_at)
);
