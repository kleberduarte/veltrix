package com.veltrix.repository;

import com.veltrix.model.ProdutoLote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProdutoLoteRepository extends JpaRepository<ProdutoLote, Long> {
    List<ProdutoLote> findByProductIdAndCompanyIdOrderByValidadeAsc(Long productId, Long companyId);
    Optional<ProdutoLote> findByIdAndCompanyId(Long id, Long companyId);
    List<ProdutoLote> findByCompanyIdAndQuantidadeAtualGreaterThan(Long companyId, Integer qty);
    void deleteByCompanyId(Long companyId);
}
