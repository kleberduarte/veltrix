package com.veltrix.dto.ordemservico;

import com.veltrix.model.enums.StatusOrdemServico;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StatusUpdateRequest {
    @NotNull
    private StatusOrdemServico status;
}
