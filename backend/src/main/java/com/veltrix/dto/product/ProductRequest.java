package com.veltrix.dto.product;

import com.veltrix.model.enums.TipoControle;
import com.veltrix.model.enums.TipoProduto;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ProductRequest {
    @NotBlank
    private String name;

    private String codigoProduto;
    private String gtinEan;
    private String descricao;
    private String categoria;

    @NotNull @DecimalMin("0.01")
    private BigDecimal price;

    private BigDecimal precoPromocional;
    private LocalDate promocaoInicio;
    private LocalDate promocaoFim;
    private Boolean emPromocao = false;
    private Integer promoQtdLevar = 0;
    private Integer promoQtdPagar = 0;

    @Min(0)
    private Integer stock = 0;

    private Integer estoqueMinimo = 0;
    private TipoProduto tipo = TipoProduto.UNIDADE;
    private TipoControle tipoControle = TipoControle.COMUM;
    private Boolean exigeReceita = false;
    private Boolean exigeLote = false;
    private Boolean exigeValidade = false;
    private String registroMs;
    private BigDecimal pmc;
}
