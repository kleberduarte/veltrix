package com.veltrix.controller;

import com.veltrix.dto.fechamentocaixa.*;
import com.veltrix.service.FechamentoCaixaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/fechamentos-caixa")
@RequiredArgsConstructor
public class FechamentoCaixaController {

    private final FechamentoCaixaService service;

    @GetMapping("/resumo-hoje")
    public ResponseEntity<ResumoDiaResponse> resumoHoje() {
        return ResponseEntity.ok(service.resumoHoje());
    }

    @PostMapping("/fechar")
    public ResponseEntity<FechamentoCaixaResponse> fechar(@RequestBody FechamentoCaixaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.fechar(request));
    }

    @GetMapping("/historico")
    public ResponseEntity<List<FechamentoCaixaResponse>> historico() {
        return ResponseEntity.ok(service.historico());
    }
}
