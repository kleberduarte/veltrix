package com.veltrix.controller;

import com.veltrix.dto.parametroempresa.*;
import com.veltrix.service.ParametroEmpresaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/parametros-empresa")
@RequiredArgsConstructor
public class ParametroEmpresaController {

    private final ParametroEmpresaService service;

    @GetMapping
    public ResponseEntity<ParametroEmpresaResponse> get() {
        return ResponseEntity.ok(service.get());
    }

    @PostMapping
    public ResponseEntity<ParametroEmpresaResponse> save(@RequestBody ParametroEmpresaRequest request) {
        return ResponseEntity.ok(service.save(request));
    }
}
