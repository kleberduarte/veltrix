package com.veltrix.dto.pdvterminal;

import com.veltrix.model.enums.StatusCaixa;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PdvTerminalResponse {
    private Long id;
    private String codigo;
    private String nome;
    private Boolean ativo;
    private String ultimoOperador;
    private LocalDateTime ultimoHeartbeat;
    private StatusCaixa statusCaixa;
}
