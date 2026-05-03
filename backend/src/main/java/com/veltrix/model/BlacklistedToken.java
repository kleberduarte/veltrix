package com.veltrix.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "blacklisted_tokens", indexes = @Index(name = "idx_blacklisted_jti", columnList = "jti"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BlacklistedToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 36)
    private String jti;

    @Column(nullable = false)
    private Instant expiresAt;
}
