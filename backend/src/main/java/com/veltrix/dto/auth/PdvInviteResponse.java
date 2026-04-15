package com.veltrix.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PdvInviteResponse {
    private Long companyId;
    private String companyName;
    private String codigo;
}
