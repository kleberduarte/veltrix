package com.veltrix.controller;

import com.veltrix.dto.cash.*;
import com.veltrix.service.CashFlowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cash")
@RequiredArgsConstructor
public class CashFlowController {

    private final CashFlowService cashFlowService;

    @GetMapping
    public ResponseEntity<List<CashFlowResponse>> findAll() {
        return ResponseEntity.ok(cashFlowService.findAll());
    }

    @PostMapping
    public ResponseEntity<CashFlowResponse> create(@Valid @RequestBody CashFlowRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cashFlowService.create(request));
    }
}
