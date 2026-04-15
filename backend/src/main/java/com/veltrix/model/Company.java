package com.veltrix.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "companies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private String plan = "FREE";

    /** Empresa reservada do sistema (ex.: nome "Default") — ADMIN_EMPRESA não acessa. */
    @Column(name = "system_default", nullable = false)
    @Builder.Default
    private Boolean systemDefault = false;

    /** Código de convite PDV da empresa (cadastro público no login). */
    @Column(name = "pdv_invite_code", length = 40)
    private String pdvInviteCode;

    /** Token único de onboarding — enviado ao cliente para criar o primeiro ADMIN_EMPRESA. Invalidado após uso. */
    @Column(name = "onboarding_token", length = 64, unique = true)
    private String onboardingToken;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
