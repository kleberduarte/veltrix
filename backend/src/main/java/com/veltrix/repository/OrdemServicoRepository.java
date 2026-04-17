package com.veltrix.repository;

import com.veltrix.model.OrdemServico;
import com.veltrix.model.enums.StatusOrdemServico;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Long> {
    List<OrdemServico> findByCompanyIdOrderByDataAberturaDesc(Long companyId);
    List<OrdemServico> findByCompanyIdAndStatusOrderByDataAberturaDesc(Long companyId, StatusOrdemServico status);
    Optional<OrdemServico> findByIdAndCompanyId(Long id, Long companyId);

    @Query("SELECT COALESCE(MAX(o.numeroOs), 0) FROM OrdemServico o WHERE o.companyId = :cid")
    Long maxNumeroOs(@Param("cid") Long companyId);

    void deleteByCompanyId(Long companyId);

    @Query("SELECT DISTINCT o.nomeCliente FROM OrdemServico o WHERE o.companyId = :cid AND o.nomeCliente IS NOT NULL AND LENGTH(o.nomeCliente) > 0 AND (:q IS NULL OR :q = '' OR LOWER(o.nomeCliente) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY o.nomeCliente")
    List<String> sugestoesNomeCliente(@Param("cid") Long cid, @Param("q") String q, Pageable pageable);

    @Query("SELECT DISTINCT o.telefoneCliente FROM OrdemServico o WHERE o.companyId = :cid AND o.telefoneCliente IS NOT NULL AND LENGTH(TRIM(o.telefoneCliente)) > 0 AND (:q IS NULL OR :q = '' OR LOWER(o.telefoneCliente) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY o.telefoneCliente")
    List<String> sugestoesTelefoneCliente(@Param("cid") Long cid, @Param("q") String q, Pageable pageable);

    @Query("SELECT DISTINCT o.contatoCliente FROM OrdemServico o WHERE o.companyId = :cid AND o.contatoCliente IS NOT NULL AND LENGTH(TRIM(o.contatoCliente)) > 0 AND (:q IS NULL OR :q = '' OR LOWER(o.contatoCliente) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY o.contatoCliente")
    List<String> sugestoesContatoCliente(@Param("cid") Long cid, @Param("q") String q, Pageable pageable);

    @Query("SELECT DISTINCT o.equipamento FROM OrdemServico o WHERE o.companyId = :cid AND o.equipamento IS NOT NULL AND LENGTH(TRIM(o.equipamento)) > 0 AND (:q IS NULL OR :q = '' OR LOWER(o.equipamento) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY o.equipamento")
    List<String> sugestoesEquipamento(@Param("cid") Long cid, @Param("q") String q, Pageable pageable);

    @Query("SELECT DISTINCT o.marca FROM OrdemServico o WHERE o.companyId = :cid AND o.marca IS NOT NULL AND LENGTH(TRIM(o.marca)) > 0 AND (:q IS NULL OR :q = '' OR LOWER(o.marca) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY o.marca")
    List<String> sugestoesMarca(@Param("cid") Long cid, @Param("q") String q, Pageable pageable);

    @Query("SELECT DISTINCT o.modelo FROM OrdemServico o WHERE o.companyId = :cid AND o.modelo IS NOT NULL AND LENGTH(TRIM(o.modelo)) > 0 AND (:q IS NULL OR :q = '' OR LOWER(o.modelo) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY o.modelo")
    List<String> sugestoesModelo(@Param("cid") Long cid, @Param("q") String q, Pageable pageable);

    @Query("SELECT DISTINCT o.numeroSerie FROM OrdemServico o WHERE o.companyId = :cid AND o.numeroSerie IS NOT NULL AND LENGTH(TRIM(o.numeroSerie)) > 0 AND (:q IS NULL OR :q = '' OR LOWER(o.numeroSerie) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY o.numeroSerie")
    List<String> sugestoesNumeroSerie(@Param("cid") Long cid, @Param("q") String q, Pageable pageable);

    @Query("SELECT DISTINCT o.tecnicoResponsavel FROM OrdemServico o WHERE o.companyId = :cid AND o.tecnicoResponsavel IS NOT NULL AND LENGTH(TRIM(o.tecnicoResponsavel)) > 0 AND (:q IS NULL OR :q = '' OR LOWER(o.tecnicoResponsavel) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY o.tecnicoResponsavel")
    List<String> sugestoesTecnicoResponsavel(@Param("cid") Long cid, @Param("q") String q, Pageable pageable);

    @Query("SELECT DISTINCT o.acessorios FROM OrdemServico o WHERE o.companyId = :cid AND o.acessorios IS NOT NULL AND LENGTH(TRIM(o.acessorios)) > 0 AND LENGTH(o.acessorios) <= 500 AND (:q IS NULL OR :q = '' OR LOWER(o.acessorios) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY o.acessorios")
    List<String> sugestoesAcessorios(@Param("cid") Long cid, @Param("q") String q, Pageable pageable);
}
