package com.veltrix.dto.cliente;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ClienteResponse {
    private Long id;
    private String nome;
    private String email;
    private String telefone;
    private String cpf;
    private String cep;
    private String endereco;
    private String codigoConvitePdv;
    private LocalDateTime createdAt;
}
