package com.veltrix.service;

import com.veltrix.dto.report.DailyReportResponse;
import com.veltrix.repository.CashFlowRepository;
import com.veltrix.repository.OrderRepository;
import com.veltrix.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final OrderRepository orderRepository;
    private final CashFlowRepository cashFlowRepository;

    public DailyReportResponse getDailyReport() {
        Long companyId = TenantContext.getCompanyId();
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = start.plusDays(1);

        BigDecimal totalSales = orderRepository.sumTotalByCompanyIdAndDate(companyId, start, end);
        Long totalOrders = orderRepository.countByCompanyIdAndDate(companyId, start, end);
        BigDecimal totalIn = cashFlowRepository.sumAmountByTypeAndDate(companyId, "IN", start, end);
        BigDecimal totalOut = cashFlowRepository.sumAmountByTypeAndDate(companyId, "OUT", start, end);

        BigDecimal averageTicket = totalOrders > 0
                ? totalSales.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return DailyReportResponse.builder()
                .totalSales(totalSales)
                .totalOrders(totalOrders)
                .averageTicket(averageTicket)
                .totalIn(totalIn)
                .totalOut(totalOut)
                .balance(totalIn.subtract(totalOut))
                .build();
    }

    /** Relatório agregado para um intervalo de datas (inclusive). */
    public DailyReportResponse getPeriodReport(LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            throw new IllegalArgumentException("Informe data inicial e final");
        }
        if (to.isBefore(from)) {
            throw new IllegalArgumentException("Data final deve ser >= data inicial");
        }
        if (ChronoUnit.DAYS.between(from, to) > 366) {
            throw new IllegalArgumentException("Intervalo máximo: 366 dias");
        }
        Long companyId = TenantContext.getCompanyId();
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();

        BigDecimal totalSales = orderRepository.sumTotalByCompanyIdAndDate(companyId, start, end);
        Long totalOrders = orderRepository.countByCompanyIdAndDate(companyId, start, end);
        BigDecimal totalIn = cashFlowRepository.sumAmountByTypeAndDate(companyId, "IN", start, end);
        BigDecimal totalOut = cashFlowRepository.sumAmountByTypeAndDate(companyId, "OUT", start, end);

        BigDecimal averageTicket = totalOrders > 0
                ? totalSales.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return DailyReportResponse.builder()
                .totalSales(totalSales)
                .totalOrders(totalOrders)
                .averageTicket(averageTicket)
                .totalIn(totalIn)
                .totalOut(totalOut)
                .balance(totalIn.subtract(totalOut))
                .build();
    }
}
