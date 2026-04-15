package com.veltrix.repository;

import com.veltrix.model.PdvTerminal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PdvTerminalRepository extends JpaRepository<PdvTerminal, Long> {
    List<PdvTerminal> findByCompanyId(Long companyId);

    List<PdvTerminal> findByCompanyIdAndAtivoTrue(Long companyId);
    Optional<PdvTerminal> findByIdAndCompanyId(Long id, Long companyId);
    boolean existsByCodigoAndCompanyId(String codigo, Long companyId);
    void deleteByCompanyId(Long companyId);
}
