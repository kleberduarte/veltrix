package com.veltrix.dto.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MeResponse {
    private Long userId;
    private String name;
    private String email;
    private Long companyId;
    private String companyName;
    private String role;
    private Boolean mustChangePassword;
    private String telefone;
}
