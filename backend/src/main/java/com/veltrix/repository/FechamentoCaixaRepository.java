package com.veltrix.repository;

import com.veltrix.model.FechamentoCaixa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface FechamentoCaixaRepository extends JpaRepository<FechamentoCaixa, Long> {
    List<FechamentoCaixa> findByCompanyIdOrderByDataFechamentoDesc(Long companyId);
    boolean existsByCompanyIdAndDataReferencia(Long companyId, LocalDate data);

    @Modifying
    @Query("UPDATE FechamentoCaixa f SET f.usuarioId = null WHERE f.usuarioId = :uid")
    int desvincularUsuario(@Param("uid") Long usuarioId);

    void deleteByCompanyId(Long companyId);
}
