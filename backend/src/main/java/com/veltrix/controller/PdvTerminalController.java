package com.veltrix.controller;

import com.veltrix.dto.pdvterminal.*;
import com.veltrix.model.User;
import com.veltrix.repository.UserRepository;
import com.veltrix.service.PdvTerminalService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/pdv-terminais")
@RequiredArgsConstructor
public class PdvTerminalController {

    private final PdvTerminalService service;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<PdvTerminalResponse>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/empresa/{companyId}")
    public ResponseEntity<List<PdvTerminalResponse>> findByEmpresa(@PathVariable Long companyId, Authentication auth) {
        User u = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));
        return ResponseEntity.ok(service.findForCompany(companyId, u));
    }

    @PostMapping
    public ResponseEntity<PdvTerminalResponse> create(@Valid @RequestBody PdvTerminalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PdvTerminalResponse> update(@PathVariable Long id,
                                                       @Valid @RequestBody PdvTerminalRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PostMapping("/{id}/heartbeat")
    public ResponseEntity<Void> heartbeat(@PathVariable Long id,
                                          @RequestBody(required = false) PdvHeartbeatRequest request,
                                          Authentication auth) {
        service.heartbeat(id, auth.getName(), request != null ? request.getStatusCaixa() : null);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
