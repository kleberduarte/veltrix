package com.veltrix.controller;

import com.veltrix.dto.cliente.*;
import com.veltrix.service.ClienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteService clienteService;

    @GetMapping
    public ResponseEntity<List<ClienteResponse>> findAll(@RequestParam(required = false) String q) {
        if (q != null && !q.isBlank())
            return ResponseEntity.ok(clienteService.search(q));
        return ResponseEntity.ok(clienteService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClienteResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(clienteService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ClienteResponse> create(@Valid @RequestBody ClienteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clienteService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClienteResponse> update(@PathVariable Long id,
                                                   @Valid @RequestBody ClienteRequest request) {
        return ResponseEntity.ok(clienteService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        clienteService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/regenerar-convite")
    public ResponseEntity<Map<String, String>> regenerarConvite(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("codigo", clienteService.regenerarConvite(id)));
    }
}
