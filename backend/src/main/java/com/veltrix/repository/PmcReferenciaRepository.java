package com.veltrix.repository;

import com.veltrix.model.PmcReferencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PmcReferenciaRepository extends JpaRepository<PmcReferencia, Long> {
    List<PmcReferencia> findByCompanyIdOrderByDescricaoAsc(Long companyId);

    @Query("SELECT p FROM PmcReferencia p WHERE p.companyId = :cid AND " +
           "(p.registroMs = :ref OR p.gtinEan = :gtin) AND " +
           "(p.vigenciaFim IS NULL OR p.vigenciaFim >= :hoje)")
    Optional<PmcReferencia> findVigente(
            @Param("cid") Long companyId,
            @Param("ref") String registroMs,
            @Param("gtin") String gtinEan,
            @Param("hoje") LocalDate hoje);

    void deleteByCompanyId(Long companyId);
}
