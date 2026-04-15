package com.veltrix.repository;

import com.veltrix.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCompanyIdAndActiveTrue(Long companyId);
    Optional<Product> findByIdAndCompanyId(Long id, Long companyId);
    void deleteByCompanyId(Long companyId);
}
