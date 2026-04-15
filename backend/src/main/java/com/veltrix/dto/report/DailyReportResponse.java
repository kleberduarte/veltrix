package com.veltrix.dto.report;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class DailyReportResponse {
    private BigDecimal totalSales;
    private Long totalOrders;
    private BigDecimal averageTicket;
    private BigDecimal totalIn;
    private BigDecimal totalOut;
    private BigDecimal balance;
}
