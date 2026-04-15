package com.veltrix.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCompanyRequest {
    @NotBlank(message = "Nome da empresa é obrigatório.")
    @Size(min = 2, max = 255, message = "Nome da empresa deve ter entre 2 e 255 caracteres.")
    private String name;
}
