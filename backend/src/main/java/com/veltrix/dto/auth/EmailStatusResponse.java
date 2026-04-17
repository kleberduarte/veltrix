package com.veltrix.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailStatusResponse {
    private boolean exists;
    /** Quando exists=true: o usuário ainda deve definir a senha definitiva (ex.: senha provisória do administrador). */
    private boolean requiresPasswordSetup;
}
