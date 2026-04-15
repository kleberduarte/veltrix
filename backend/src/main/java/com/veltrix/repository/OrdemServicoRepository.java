package com.veltrix.repository;

import com.veltrix.model.OrdemServico;
import com.veltrix.model.enums.StatusOrdemServico;
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
}
