package com.veltrix.controller;

import com.veltrix.dto.produtelote.*;
import com.veltrix.service.ProdutoLoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/produto-lotes")
@RequiredArgsConstructor
public class ProdutoLoteController {

    private final ProdutoLoteService service;

    @GetMapping("/produto/{productId}")
    public ResponseEntity<List<ProdutoLoteResponse>> findByProduto(@PathVariable Long productId) {
        return ResponseEntity.ok(service.findByProduto(productId));
    }

    @PostMapping
    public ResponseEntity<ProdutoLoteResponse> create(@Valid @RequestBody ProdutoLoteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProdutoLoteResponse> update(@PathVariable Long id,
                                                       @Valid @RequestBody ProdutoLoteRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
