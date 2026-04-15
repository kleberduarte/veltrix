package com.veltrix.repository;

import com.veltrix.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    @Query("SELECT o FROM Order o WHERE o.companyId = :companyId AND o.createdAt >= :start AND o.createdAt < :end ORDER BY o.createdAt DESC")
    List<Order> findByCompanyIdAndCreatedAtBetween(
            @Param("companyId") Long companyId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.companyId = :companyId AND o.createdAt >= :start AND o.createdAt < :end")
    Long countByCompanyIdAndDate(
            @Param("companyId") Long companyId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.companyId = :companyId AND o.createdAt >= :start AND o.createdAt < :end")
    BigDecimal sumTotalByCompanyIdAndDate(
            @Param("companyId") Long companyId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    long countByUsuarioId(Long usuarioId);

    @Modifying
    @Query(value = "UPDATE orders SET usuario_id = :novo WHERE usuario_id = :antigo", nativeQuery = true)
    int reatribuirUsuarioPedidos(@Param("antigo") Long antigo, @Param("novo") Long novo);

    @Modifying
    @Query("DELETE FROM Order o WHERE o.companyId = :companyId")
    void deleteByCompanyId(@Param("companyId") Long companyId);
}
