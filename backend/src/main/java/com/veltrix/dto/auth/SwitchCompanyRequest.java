package com.veltrix.dto.auth;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SwitchCompanyRequest {
    @NotNull(message = "Informe o ID da empresa.")
    private Long companyId;
}
