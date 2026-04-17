package com.veltrix.model;

import com.veltrix.model.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private Role role = Role.VENDEDOR;

    @Column
    private String telefone;

    @Column(name = "must_change_password", nullable = false)
    @Builder.Default
    private Boolean mustChangePassword = false;

    /**
     * true = cadastro via convite PDV sem senha no formulário; senha será definida só em /primeiro-acesso.
     * false = senha provisória do admin ou senha já informada no cadastro.
     */
    @Column(name = "invite_self_registration", nullable = false)
    @Builder.Default
    private Boolean inviteSelfRegistration = false;

    /** Único terminal PDV em que o usuário pode operar (opcional). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pdv_terminal_id")
    private PdvTerminal pdvTerminal;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
