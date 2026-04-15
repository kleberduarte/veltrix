package com.veltrix.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "clientes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(nullable = false)
    private String nome;

    @Column
    private String email;

    @Column
    private String telefone;

    @Column
    private String cpf;

    /** CEP com 8 digitos (sem hifen), opcional. */
    @Column(length = 8)
    private String cep;

    @Column(columnDefinition = "TEXT")
    private String endereco;

    @Column(name = "codigo_convite_pdv")
    private String codigoConvitePdv;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = LocalDateTime.now(); }
}
