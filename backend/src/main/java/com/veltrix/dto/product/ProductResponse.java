package com.veltrix.dto.product;

import com.veltrix.model.enums.TipoControle;
import com.veltrix.model.enums.TipoProduto;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ProductResponse {
    private Long id;
    private String name;
    private String codigoProduto;
    private String gtinEan;
    private String descricao;
    private String categoria;
    private BigDecimal price;
    private BigDecimal precoPromocional;
    private LocalDate promocaoInicio;
    private LocalDate promocaoFim;
    private Boolean emPromocao;
    private Integer promoQtdLevar;
    private Integer promoQtdPagar;
    private Integer stock;
    private Integer estoqueMinimo;
    private Boolean active;
    private TipoProduto tipo;
    private TipoControle tipoControle;
    private Boolean exigeReceita;
    private Boolean exigeLote;
    private Boolean exigeValidade;
    private String registroMs;
    private BigDecimal pmc;
    private BigDecimal precoEfetivo; // calculado
    private LocalDateTime createdAt;
}
