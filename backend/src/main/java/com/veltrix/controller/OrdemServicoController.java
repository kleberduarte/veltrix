package com.veltrix.controller;

import com.veltrix.dto.ordemservico.*;
import com.veltrix.model.enums.StatusOrdemServico;
import com.veltrix.service.OrdemServicoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ordens-servico")
@RequiredArgsConstructor
public class OrdemServicoController {

    private final OrdemServicoService service;

    @GetMapping
    public ResponseEntity<List<OrdemServicoResponse>> findAll(
            @RequestParam(required = false) StatusOrdemServico status) {
        if (status != null) return ResponseEntity.ok(service.findByStatus(status));
        return ResponseEntity.ok(service.findAll());
    }

    /** Autocomplete: valores distintos já gravados em OS (por empresa). */
    @GetMapping("/sugestoes")
    public ResponseEntity<List<String>> sugestoes(
            @RequestParam String campo,
            @RequestParam(required = false, defaultValue = "") String q) {
        return ResponseEntity.ok(service.sugestoes(campo, q));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrdemServicoResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<OrdemServicoResponse> create(@Valid @RequestBody OrdemServicoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrdemServicoResponse> update(@PathVariable Long id,
                                                        @Valid @RequestBody OrdemServicoRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrdemServicoResponse> updateStatus(@PathVariable Long id,
                                                              @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(service.updateStatus(id, request.getStatus()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
