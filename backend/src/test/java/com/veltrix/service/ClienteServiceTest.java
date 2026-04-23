package com.veltrix.service;

import com.veltrix.dto.cliente.ClienteRequest;
import com.veltrix.model.Cliente;
import com.veltrix.repository.ClienteRepository;
import com.veltrix.security.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClienteServiceTest {

    @Mock
    private ClienteRepository clienteRepository;

    @InjectMocks
    private ClienteService clienteService;

    private static final Long COMPANY_ID = 1L;
    // CPF válido para os testes
    private static final String CPF_VALIDO = "52998224725";

    @BeforeEach
    void setup() {
        TenantContext.setCompanyId(COMPANY_ID);
    }

    @AfterEach
    void teardown() {
        TenantContext.clear();
    }

    // -------------------------------------------------------------------------
    // CPF
    // -------------------------------------------------------------------------
    @Nested
    class ValidacaoCpf {

        @Test
        void cpfComMenosDe11Digitos_lancaException() {
            ClienteRequest req = requestBase("1234567890"); // 10 dígitos

            assertThatThrownBy(() -> clienteService.create(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("CPF deve conter 11 dígitos");
        }

        @Test
        void cpfComDigitosRepetidos_lancaException() {
            ClienteRequest req = requestBase("00000000000");

            assertThatThrownBy(() -> clienteService.create(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("CPF inválido");
        }

        @Test
        void cpfFormatado_aceito() {
            ClienteRequest req = requestBase("529.982.247-25");
            when(clienteRepository.existsByCompanyIdAndEmailIgnoreCase(eq(COMPANY_ID), anyString())).thenReturn(false);
            when(clienteRepository.existsByCompanyIdAndCpf(eq(COMPANY_ID), eq("52998224725"))).thenReturn(false);
            when(clienteRepository.save(any())).thenAnswer(i -> {
                Cliente c = i.getArgument(0);
                c.setId(1L);
                return c;
            });

            assertThatCode(() -> clienteService.create(req)).doesNotThrowAnyException();
        }

        @Test
        void cpfDuplicadoNaEmpresa_lancaException() {
            ClienteRequest req = requestBase(CPF_VALIDO);
            when(clienteRepository.existsByCompanyIdAndEmailIgnoreCase(eq(COMPANY_ID), anyString())).thenReturn(false);
            when(clienteRepository.existsByCompanyIdAndCpf(COMPANY_ID, CPF_VALIDO)).thenReturn(true);

            assertThatThrownBy(() -> clienteService.create(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("CPF já cadastrado");
        }
    }

    // -------------------------------------------------------------------------
    // CEP
    // -------------------------------------------------------------------------
    @Nested
    class ValidacaoCep {

        @Test
        void cepComMenosDe8Digitos_lancaException() {
            ClienteRequest req = requestBase(CPF_VALIDO);
            req.setCep("1234567"); // 7 dígitos

            assertThatThrownBy(() -> clienteService.create(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("CEP deve conter 8 dígitos");
        }

        @Test
        void cepComMaisDe8Digitos_lancaException() {
            ClienteRequest req = requestBase(CPF_VALIDO);
            req.setCep("123456789");

            assertThatThrownBy(() -> clienteService.create(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("CEP deve conter 8 dígitos");
        }

        @Test
        void cepNulo_aceito() {
            ClienteRequest req = requestBase(CPF_VALIDO);
            req.setCep(null);
            req.setEndereco(null);
            when(clienteRepository.existsByCompanyIdAndEmailIgnoreCase(any(), any())).thenReturn(false);
            when(clienteRepository.existsByCompanyIdAndCpf(any(), any())).thenReturn(false);
            when(clienteRepository.save(any())).thenAnswer(i -> { Cliente c = i.getArgument(0); c.setId(1L); return c; });

            assertThatCode(() -> clienteService.create(req)).doesNotThrowAnyException();
        }

        @Test
        void cepFormatado_aceito() {
            ClienteRequest req = requestBase(CPF_VALIDO);
            req.setCep("01310-100");
            req.setEndereco("Av. Paulista, 1000, apto 10");
            when(clienteRepository.existsByCompanyIdAndEmailIgnoreCase(any(), any())).thenReturn(false);
            when(clienteRepository.existsByCompanyIdAndCpf(any(), any())).thenReturn(false);
            when(clienteRepository.save(any())).thenAnswer(i -> { Cliente c = i.getArgument(0); c.setId(1L); return c; });

            assertThatCode(() -> clienteService.create(req)).doesNotThrowAnyException();
        }
    }

    // -------------------------------------------------------------------------
    // Endereço
    // -------------------------------------------------------------------------
    @Nested
    class ValidacaoEndereco {

        @Test
        void semCep_enderecoVazio_aceito() {
            ClienteRequest req = requestBase(CPF_VALIDO);
            req.setCep(null);
            req.setEndereco("");
            when(clienteRepository.existsByCompanyIdAndEmailIgnoreCase(any(), any())).thenReturn(false);
            when(clienteRepository.existsByCompanyIdAndCpf(any(), any())).thenReturn(false);
            when(clienteRepository.save(any())).thenAnswer(i -> { Cliente c = i.getArgument(0); c.setId(1L); return c; });

            assertThatCode(() -> clienteService.create(req)).doesNotThrowAnyException();
        }

        @ParameterizedTest
        @ValueSource(strings = {"a", "ab", "123456789"}) // 1 a 9 chars
        void semCep_enderecoCurto_lancaException(String enderecoCurto) {
            ClienteRequest req = requestBase(CPF_VALIDO);
            req.setCep(null);
            req.setEndereco(enderecoCurto);

            assertThatThrownBy(() -> clienteService.create(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("pelo menos 10 caracteres");
        }

        @Test
        void semCep_enderecoLongo_aceito() {
            ClienteRequest req = requestBase(CPF_VALIDO);
            req.setCep(null);
            req.setEndereco("Rua das Flores, 123");
            when(clienteRepository.existsByCompanyIdAndEmailIgnoreCase(any(), any())).thenReturn(false);
            when(clienteRepository.existsByCompanyIdAndCpf(any(), any())).thenReturn(false);
            when(clienteRepository.save(any())).thenAnswer(i -> { Cliente c = i.getArgument(0); c.setId(1L); return c; });

            assertThatCode(() -> clienteService.create(req)).doesNotThrowAnyException();
        }

        @Test
        void comCep_semEndereco_lancaException() {
            ClienteRequest req = requestBase(CPF_VALIDO);
            req.setCep("01310100");
            req.setEndereco(null);

            assertThatThrownBy(() -> clienteService.create(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("número é obrigatório");
        }

        @Test
        void comCep_enderecoLongo_aceito() {
            ClienteRequest req = requestBase(CPF_VALIDO);
            req.setCep("01310100");
            req.setEndereco("Av. Paulista, 1000, apto 10");
            when(clienteRepository.existsByCompanyIdAndEmailIgnoreCase(any(), any())).thenReturn(false);
            when(clienteRepository.existsByCompanyIdAndCpf(any(), any())).thenReturn(false);
            when(clienteRepository.save(any())).thenAnswer(i -> { Cliente c = i.getArgument(0); c.setId(1L); return c; });

            assertThatCode(() -> clienteService.create(req)).doesNotThrowAnyException();
        }
    }

    // -------------------------------------------------------------------------
    // Email
    // -------------------------------------------------------------------------
    @Nested
    class ValidacaoEmail {

        @Test
        void emailDuplicadoNaEmpresa_lancaException() {
            ClienteRequest req = requestBase(CPF_VALIDO);
            when(clienteRepository.existsByCompanyIdAndEmailIgnoreCase(COMPANY_ID, "joao@email.com")).thenReturn(true);

            assertThatThrownBy(() -> clienteService.create(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("E-mail já cadastrado");
        }

        @Test
        void emailNormalizadoParaMinusculo() {
            ClienteRequest req = requestBase(CPF_VALIDO);
            req.setEmail("JOAO@EMAIL.COM");
            when(clienteRepository.existsByCompanyIdAndEmailIgnoreCase(eq(COMPANY_ID), eq("joao@email.com"))).thenReturn(false);
            when(clienteRepository.existsByCompanyIdAndCpf(any(), any())).thenReturn(false);
            when(clienteRepository.save(any())).thenAnswer(i -> {
                Cliente c = i.getArgument(0);
                c.setId(1L);
                return c;
            });

            var response = clienteService.create(req);

            assertThat(response.getEmail()).isEqualTo("joao@email.com");
        }
    }

    // -------------------------------------------------------------------------
    // findById
    // -------------------------------------------------------------------------
    @Nested
    class FindById {

        @Test
        void clienteNaoEncontrado_lancaException() {
            when(clienteRepository.findByIdAndCompanyId(99L, COMPANY_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> clienteService.findById(99L))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Cliente não encontrado");
        }
    }

    // -------------------------------------------------------------------------
    // regenerarConvite
    // -------------------------------------------------------------------------
    @Nested
    class RegenarConvite {

        @Test
        void regenerarConvite_atualizaCodigo() {
            Cliente c = Cliente.builder().id(1L).companyId(COMPANY_ID)
                    .codigoConvitePdv("ANTIGO01").build();
            when(clienteRepository.findByIdAndCompanyId(1L, COMPANY_ID)).thenReturn(Optional.of(c));
            when(clienteRepository.save(any())).thenAnswer(i -> i.getArgument(0));

            String novo = clienteService.regenerarConvite(1L);

            assertThat(novo).hasSize(8);
            assertThat(novo).isNotEqualTo("ANTIGO01");
            assertThat(c.getCodigoConvitePdv()).isEqualTo(novo);
        }
    }

    // -------------------------------------------------------------------------
    // helpers
    // -------------------------------------------------------------------------
    private ClienteRequest requestBase(String cpf) {
        ClienteRequest req = new ClienteRequest();
        req.setNome("João Silva");
        req.setEmail("joao@email.com");
        req.setTelefone("11987654321");
        req.setCpf(cpf);
        return req;
    }
}
