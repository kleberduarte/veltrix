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
    @Size(max = 255)
    private String name;

    @Size(max = 100)
    private String codigoProduto;

    @Size(max = 20)
    private String gtinEan;

    @Size(max = 2000)
    private String descricao;

    @Size(max = 100)
    private String categoria;

    @Size(max = 1000)
    private String imagemUrl;

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

    @Size(max = 50)
    private String registroMs;

    private BigDecimal pmc;
}
