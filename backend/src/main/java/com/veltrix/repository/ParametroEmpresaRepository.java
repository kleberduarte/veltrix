package com.veltrix.repository;

import com.veltrix.model.ParametroEmpresa;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ParametroEmpresaRepository extends JpaRepository<ParametroEmpresa, Long> {
    Optional<ParametroEmpresa> findByCompanyId(Long companyId);
    void deleteByCompanyId(Long companyId);
}
