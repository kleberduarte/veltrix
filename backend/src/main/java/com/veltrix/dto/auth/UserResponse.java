package com.veltrix.dto.auth;

import com.veltrix.model.enums.Role;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private String telefone;
    private Boolean mustChangePassword;
    private Long companyId;
    private String companyName;
    private Long pdvTerminalId;
    private String pdvTerminalCodigo;
    private LocalDateTime createdAt;
}
