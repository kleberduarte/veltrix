package com.veltrix.service;

import com.veltrix.dto.ordemservico.OrdemServicoRequest;
import com.veltrix.model.Company;
import com.veltrix.model.OrdemServico;
import com.veltrix.model.ParametroEmpresa;
import com.veltrix.model.enums.StatusOrdemServico;
import com.veltrix.repository.CompanyRepository;
import com.veltrix.repository.OrdemServicoRepository;
import com.veltrix.repository.ParametroEmpresaRepository;
import com.veltrix.security.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrdemServicoServiceTest {

    @Mock
    private OrdemServicoRepository repository;

    @Mock
    private ParametroEmpresaRepository parametroEmpresaRepository;

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private OrdemServicoService ordemServicoService;

    private static final Long COMPANY_ID = 10L;

    @BeforeEach
    void setup() {
        TenantContext.setCompanyId(COMPANY_ID);
    }

    @AfterEach
    void teardown() {
        TenantContext.clear();
    }

    // -------------------------------------------------------------------------
    // Verificação de módulo
    // -------------------------------------------------------------------------
    @Nested
    class ModuloInformatica {

        @Test
        void moduloDesativado_lancaForbidden() {
            habilitarEmpresaNormal();
            when(parametroEmpresaRepository.findByCompanyId(COMPANY_ID))
                    .thenReturn(Optional.of(parametroComModulo(false)));

            assertThatThrownBy(() -> ordemServicoService.findAll())
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Módulo de informática desativado");
        }

        @Test
        void moduloAtivo_naoLancaException() {
            habilitarEmpresaNormal();
            when(parametroEmpresaRepository.findByCompanyId(COMPANY_ID))
                    .thenReturn(Optional.of(parametroComModulo(true)));
            when(repository.findByCompanyIdOrderByDataAberturaDesc(COMPANY_ID)).thenReturn(java.util.List.of());

            assertThatCode(() -> ordemServicoService.findAll()).doesNotThrowAnyException();
        }

        @Test
        void empresaReservada_bypassModulo() {
            Company reservada = Company.builder().id(COMPANY_ID).name("Default").systemDefault(true).build();
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(reservada));
            when(repository.findByCompanyIdOrderByDataAberturaDesc(COMPANY_ID)).thenReturn(java.util.List.of());

            assertThatCode(() -> ordemServicoService.findAll()).doesNotThrowAnyException();
            verify(parametroEmpresaRepository, never()).findByCompanyId(any());
        }

        @Test
        void empresaComNomeSistema_bypassModulo() {
            Company reservada = Company.builder().id(COMPANY_ID).name("Sistema").systemDefault(false).build();
            when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(reservada));
            when(repository.findByCompanyIdOrderByDataAberturaDesc(COMPANY_ID)).thenReturn(java.util.List.of());

            assertThatCode(() -> ordemServicoService.findAll()).doesNotThrowAnyException();
        }
    }

    // -------------------------------------------------------------------------
    // Transições de status
    // -------------------------------------------------------------------------
    @Nested
    class TransicoesStatus {

        @ParameterizedTest(name = "{0} → {1} = válida")
        @CsvSource({
            "ABERTA, EM_ANALISE",
            "ABERTA, CANCELADA",
            "EM_ANALISE, AGUARDANDO_APROVACAO",
            "EM_ANALISE, CANCELADA",
            "AGUARDANDO_APROVACAO, CONCLUIDA",
            "AGUARDANDO_APROVACAO, CANCELADA",
            "CONCLUIDA, ENTREGUE",
            "CONCLUIDA, CANCELADA"
        })
        void transicaoValida_salvaOS(String de, String para) {
            habilitarModulo();
            StatusOrdemServico statusDe = StatusOrdemServico.valueOf(de);
            StatusOrdemServico statusPara = StatusOrdemServico.valueOf(para);
            OrdemServico os = osComStatus(statusDe);
            when(repository.findByIdAndCompanyId(1L, COMPANY_ID)).thenReturn(Optional.of(os));
            when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

            var response = ordemServicoService.updateStatus(1L, statusPara);

            assertThat(response.getStatus()).isEqualTo(statusPara);
        }

        @ParameterizedTest(name = "{0} → {1} = inválida")
        @CsvSource({
            "ABERTA, CONCLUIDA",
            "ABERTA, ENTREGUE",
            "EM_ANALISE, CONCLUIDA",
            "EM_ANALISE, ENTREGUE",
            "AGUARDANDO_APROVACAO, EM_ANALISE",
            "CONCLUIDA, EM_ANALISE",
            "ENTREGUE, CANCELADA",
            "CANCELADA, ABERTA"
        })
        void transicaoInvalida_lancaException(String de, String para) {
            habilitarModulo();
            StatusOrdemServico statusDe = StatusOrdemServico.valueOf(de);
            StatusOrdemServico statusPara = StatusOrdemServico.valueOf(para);
            OrdemServico os = osComStatus(statusDe);
            when(repository.findByIdAndCompanyId(1L, COMPANY_ID)).thenReturn(Optional.of(os));

            assertThatThrownBy(() -> ordemServicoService.updateStatus(1L, statusPara))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Transição inválida");
        }

        @Test
        void transicaoParaConcluida_setaDataConclusao() {
            habilitarModulo();
            OrdemServico os = osComStatus(StatusOrdemServico.AGUARDANDO_APROVACAO);
            when(repository.findByIdAndCompanyId(1L, COMPANY_ID)).thenReturn(Optional.of(os));
            when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

            ordemServicoService.updateStatus(1L, StatusOrdemServico.CONCLUIDA);

            assertThat(os.getDataConclusao()).isNotNull();
        }

        @Test
        void transicaoParaEntregue_setaDataEntrega() {
            habilitarModulo();
            OrdemServico os = osComStatus(StatusOrdemServico.CONCLUIDA);
            when(repository.findByIdAndCompanyId(1L, COMPANY_ID)).thenReturn(Optional.of(os));
            when(repository.save(any())).thenAnswer(i -> i.getArgument(0));

            ordemServicoService.updateStatus(1L, StatusOrdemServico.ENTREGUE);

            assertThat(os.getDataEntrega()).isNotNull();
        }
    }

    // -------------------------------------------------------------------------
    // Criação de OS
    // -------------------------------------------------------------------------
    @Nested
    class CriacaoOs {

        @Test
        void create_calculaValorTotalComDesconto() {
            habilitarModulo();
            when(repository.maxNumeroOs(COMPANY_ID)).thenReturn(5L);
            when(repository.save(any())).thenAnswer(i -> {
                OrdemServico os = i.getArgument(0);
                os.setId(1L);
                return os;
            });

            OrdemServicoRequest req = new OrdemServicoRequest();
            req.setNomeCliente("João");
            req.setDefeitoRelatado("Não liga");
            req.setValorServico(new BigDecimal("200.00"));
            req.setDesconto(new BigDecimal("30.00"));

            var response = ordemServicoService.create(req);

            assertThat(response.getValorTotal()).isEqualByComparingTo("170.00");
        }

        @Test
        void create_descontoMaiorQueServico_totalZero() {
            habilitarModulo();
            when(repository.maxNumeroOs(COMPANY_ID)).thenReturn(0L);
            when(repository.save(any())).thenAnswer(i -> { OrdemServico os = i.getArgument(0); os.setId(1L); return os; });

            OrdemServicoRequest req = new OrdemServicoRequest();
            req.setNomeCliente("Maria");
            req.setDefeitoRelatado("Tela quebrada");
            req.setValorServico(new BigDecimal("50.00"));
            req.setDesconto(new BigDecimal("100.00"));

            var response = ordemServicoService.create(req);

            assertThat(response.getValorTotal()).isEqualByComparingTo("0.00");
        }

        @Test
        void create_numeroOsIncrementado() {
            habilitarModulo();
            when(repository.maxNumeroOs(COMPANY_ID)).thenReturn(7L);
            when(repository.save(any())).thenAnswer(i -> {
                OrdemServico os = i.getArgument(0);
                os.setId(1L);
                return os;
            });

            OrdemServicoRequest req = new OrdemServicoRequest();
            req.setNomeCliente("Pedro");
            req.setDefeitoRelatado("Problema");

            var response = ordemServicoService.create(req);

            assertThat(response.getNumeroOs()).isEqualTo(8L);
        }

        @Test
        void os_naoEncontrada_lancaException() {
            habilitarModulo();
            when(repository.findByIdAndCompanyId(99L, COMPANY_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> ordemServicoService.findById(99L))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("OS não encontrada");
        }
    }

    // -------------------------------------------------------------------------
    // helpers
    // -------------------------------------------------------------------------
    private void habilitarModulo() {
        habilitarEmpresaNormal();
        when(parametroEmpresaRepository.findByCompanyId(COMPANY_ID))
                .thenReturn(Optional.of(parametroComModulo(true)));
    }

    private void habilitarEmpresaNormal() {
        Company company = Company.builder().id(COMPANY_ID).name("Empresa Teste").systemDefault(false).build();
        when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(company));
    }

    private ParametroEmpresa parametroComModulo(boolean ativo) {
        ParametroEmpresa p = new ParametroEmpresa();
        p.setModuloInformaticaAtivo(ativo);
        return p;
    }

    private OrdemServico osComStatus(StatusOrdemServico status) {
        return OrdemServico.builder()
                .id(1L)
                .companyId(COMPANY_ID)
                .nomeCliente("Cliente Teste")
                .defeitoRelatado("Defeito")
                .status(status)
                .numeroOs(1L)
                .valorServico(BigDecimal.ZERO)
                .desconto(BigDecimal.ZERO)
                .valorTotal(BigDecimal.ZERO)
                .build();
    }
}
