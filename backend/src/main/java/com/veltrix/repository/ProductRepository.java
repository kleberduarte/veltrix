package com.veltrix.repository;

import com.veltrix.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCompanyIdAndActiveTrue(Long companyId);
    Optional<Product> findByIdAndCompanyId(Long id, Long companyId);
    void deleteByCompanyId(Long companyId);

    @Modifying
    @Query("update Product p set p.active = false where p.companyId = :companyId and p.active = true")
    int deactivateAllByCompanyId(@Param("companyId") Long companyId);
}
