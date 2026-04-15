package com.veltrix.dto.ordemservico;

import com.veltrix.model.enums.StatusOrdemServico;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class OrdemServicoResponse {
    private Long id;
    private Long numeroOs;
    private Long clienteId;
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
    private BigDecimal valorTotal;
    private StatusOrdemServico status;
    private LocalDateTime dataAbertura;
    private LocalDate dataPrevisaoEntrega;
    private LocalDateTime dataConclusao;
    private LocalDateTime dataEntrega;
    private Long vendaId;
    private LocalDateTime createdAt;
}
