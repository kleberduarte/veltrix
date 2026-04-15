package com.veltrix.dto.pdvterminal;

import com.veltrix.model.enums.StatusCaixa;
import lombok.Data;

@Data
public class PdvHeartbeatRequest {
    private StatusCaixa statusCaixa;
}
