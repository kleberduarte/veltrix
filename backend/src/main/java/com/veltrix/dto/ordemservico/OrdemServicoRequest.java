package com.veltrix.dto.ordemservico;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class OrdemServicoRequest {
    private Long clienteId;

    @NotBlank
    private String nomeCliente;

    private String telefoneCliente;
    private String contatoCliente;
    private String equipamento;
    private String marca;
    private String modelo;
    private String numeroSerie;
    private String acessorios;
    private String defeitoRelatado;
    private String diagnostico;
    private String servicoExecutado;
    private String tecnicoResponsavel;
    private String observacao;
    private BigDecimal valorServico;
    private BigDecimal desconto;
    private LocalDate dataPrevisaoEntrega;
}
