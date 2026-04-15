package com.veltrix.controller;

import com.veltrix.dto.report.DailyReportResponse;
import com.veltrix.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/daily")
    public ResponseEntity<DailyReportResponse> getDaily() {
        return ResponseEntity.ok(reportService.getDailyReport());
    }

    @GetMapping("/period")
    public ResponseEntity<DailyReportResponse> getPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getPeriodReport(from, to));
    }
}
