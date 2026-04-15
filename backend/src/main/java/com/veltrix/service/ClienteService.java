package com.veltrix.service;

import com.veltrix.dto.cliente.*;
import com.veltrix.model.Cliente;
import com.veltrix.repository.ClienteRepository;
import com.veltrix.security.TenantContext;
import com.veltrix.util.CpfValidator;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public List<ClienteResponse> findAll() {
        return clienteRepository.findByCompanyIdOrderByNomeAsc(TenantContext.getCompanyId())
                .stream().map(this::toResponse).toList();
    }

    public List<ClienteResponse> search(String q) {
        return clienteRepository.search(TenantContext.getCompanyId(), q)
                .stream().map(this::toResponse).toList();
    }

    public ClienteResponse findById(Long id) {
        return toResponse(clienteRepository.findByIdAndCompanyId(id, TenantContext.getCompanyId())
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado")));
    }

    @Transactional
    public ClienteResponse create(ClienteRequest request) {
        Long companyId = TenantContext.getCompanyId();
        String nome = normalizarNome(request.getNome());
        String email = normalizarEmail(request.getEmail());
        String telefone = normalizarTelefone(request.getTelefone());
        String cpf = normalizarCpfObrigatorio(request.getCpf());
        String cep = normalizarCepOpcional(request.getCep());
        String endereco = request.getEndereco() != null ? request.getEndereco().trim() : null;
        validarEnderecoOuCep(cep, endereco);

        if (clienteRepository.existsByCompanyIdAndEmailIgnoreCase(companyId, email)) {
            throw new IllegalArgumentException("E-mail já cadastrado para esta empresa");
        }
        if (clienteRepository.existsByCompanyIdAndCpf(companyId, cpf)) {
            throw new IllegalArgumentException("CPF já cadastrado para esta empresa");
        }

        Cliente cliente = Cliente.builder()
                .companyId(companyId)
                .nome(nome)
                .email(email)
                .telefone(telefone)
                .cpf(cpf)
                .cep(cep)
                .endereco(endereco)
                .codigoConvitePdv(UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .build();
        return toResponse(clienteRepository.save(cliente));
    }

    @Transactional
    public ClienteResponse update(Long id, ClienteRequest request) {
        Long companyId = TenantContext.getCompanyId();
        Cliente cliente = clienteRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));

        String nome = normalizarNome(request.getNome());
        String email = normalizarEmail(request.getEmail());
        String telefone = normalizarTelefone(request.getTelefone());
        String cpf = normalizarCpfObrigatorio(request.getCpf());
        String cep = normalizarCepOpcional(request.getCep());
        String endereco = request.getEndereco() != null ? request.getEndereco().trim() : null;
        validarEnderecoOuCep(cep, endereco);

        String emailAtual = normalizarEmail(cliente.getEmail());
        if (!email.equals(emailAtual)
                && clienteRepository.existsByCompanyIdAndEmailIgnoreCaseAndIdNot(companyId, email, id)) {
            throw new IllegalArgumentException("E-mail já cadastrado para esta empresa");
        }
        String cpfAtual = CpfValidator.apenasDigitos(cliente.getCpf());
        if (!cpf.equals(cpfAtual)
                && clienteRepository.existsByCompanyIdAndCpfAndIdNot(companyId, cpf, id)) {
            throw new IllegalArgumentException("CPF já cadastrado para esta empresa");
        }

        cliente.setNome(nome);
        cliente.setEmail(email);
        cliente.setTelefone(telefone);
        cliente.setCpf(cpf);
        cliente.setCep(cep);
        cliente.setEndereco(endereco);
        return toResponse(clienteRepository.save(cliente));
    }

    @Transactional
    public void delete(Long id) {
        Cliente cliente = clienteRepository.findByIdAndCompanyId(id, TenantContext.getCompanyId())
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));
        clienteRepository.delete(cliente);
    }

    @Transactional
    public String regenerarConvite(Long id) {
        Cliente cliente = clienteRepository.findByIdAndCompanyId(id, TenantContext.getCompanyId())
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));
        String novoCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        cliente.setCodigoConvitePdv(novoCode);
        clienteRepository.save(cliente);
        return novoCode;
    }

    private static String normalizarNome(String nome) {
        if (nome == null) return "";
        return nome.trim().replaceAll("\\s+", " ");
    }

    private static String normalizarEmail(String email) {
        if (email == null) return "";
        return email.trim().toLowerCase();
    }

    private static String normalizarTelefone(String telefone) {
        if (telefone == null) return "";
        return telefone.trim();
    }

    private static String normalizarCpfObrigatorio(String cpf) {
        String d = CpfValidator.apenasDigitos(cpf);
        if (d.length() != 11) {
            throw new IllegalArgumentException("CPF deve conter 11 dígitos");
        }
        if (!CpfValidator.valido(d)) {
            throw new IllegalArgumentException("CPF inválido");
        }
        return d;
    }

    /** CEP com 8 dígitos ou null. */
    private static String normalizarCepOpcional(String cep) {
        if (cep == null || cep.isBlank()) return null;
        String d = cep.replaceAll("\\D", "");
        if (d.length() != 8) {
            throw new IllegalArgumentException("CEP deve conter 8 dígitos");
        }
        return d;
    }

    /**
     * Com CEP: exige endereço montado (≥10 caracteres). Sem CEP: endereço vazio ou ≥10; 1–9 caracteres é inválido.
     */
    private static void validarEnderecoOuCep(String cep, String endereco) {
        boolean temCep = cep != null && !cep.isBlank();
        String e = endereco == null ? "" : endereco.trim();
        boolean enderecoLongo = e.length() >= 10;
        boolean enderecoCurto = e.length() > 0 && e.length() < 10;

        if (temCep) {
            if (!enderecoLongo) {
                throw new IllegalArgumentException("Preencha o endereço após buscar o CEP (número é obrigatório).");
            }
            return;
        }
        if (enderecoCurto) {
            throw new IllegalArgumentException("Endereço deve ter pelo menos 10 caracteres ou deixe em branco.");
        }
    }

    private ClienteResponse toResponse(Cliente c) {
        ClienteResponse r = new ClienteResponse();
        r.setId(c.getId());
        r.setNome(c.getNome());
        r.setEmail(c.getEmail());
        r.setTelefone(c.getTelefone());
        r.setCpf(c.getCpf());
        r.setCep(c.getCep());
        r.setEndereco(c.getEndereco());
        r.setCodigoConvitePdv(c.getCodigoConvitePdv());
        r.setCreatedAt(c.getCreatedAt());
        return r;
    }
}
