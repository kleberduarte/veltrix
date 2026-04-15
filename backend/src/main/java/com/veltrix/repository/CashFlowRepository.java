package com.veltrix.repository;

import com.veltrix.model.CashFlow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface CashFlowRepository extends JpaRepository<CashFlow, Long> {
    List<CashFlow> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    List<CashFlow> findByCompanyIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long companyId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM CashFlow c WHERE c.companyId = :companyId AND c.type = :type AND c.createdAt >= :start AND c.createdAt < :end")
    BigDecimal sumAmountByTypeAndDate(
            @Param("companyId") Long companyId,
            @Param("type") String type,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    void deleteByCompanyId(Long companyId);
}
