package com.veltrix.exception;

import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(EntityNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return error(HttpStatus.UNAUTHORIZED, "Credenciais inválidas");
    }

    @ExceptionHandler(InternalAuthenticationServiceException.class)
    public ResponseEntity<Map<String, Object>> handleInternalAuthService(InternalAuthenticationServiceException ex) {
        Throwable cause = ex.getCause();
        if (cause instanceof BadCredentialsException) {
            return error(HttpStatus.UNAUTHORIZED, "Credenciais inválidas");
        }
        log.error("Erro interno de autenticação", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno durante autenticação");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(ValidationException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", ex.getMessage());
        body.put("fields", ex.getFields());
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        String msg = ex.getReason();
        if (msg == null || msg.isBlank()) {
            msg = status.getReasonPhrase();
        }
        if (status.is5xxServerError()) {
            log.error("ResponseStatusException {}: {}", status.value(), msg, ex);
        }
        return error(status, msg);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleNotReadable(HttpMessageNotReadableException ex) {
        String root = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
        if (root != null && (root.contains("FormaPagamento") || root.contains("formaPagamento"))) {
            return error(HttpStatus.BAD_REQUEST,
                    "Forma de pagamento inválida. Valores aceitos: DINHEIRO, DEBITO, CARTAO, PIX, VOUCHER.");
        }
        return error(HttpStatus.BAD_REQUEST, "Corpo da requisição inválido ou incompleto.");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        String m = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : "";
        if (m.contains("forma_pagamento") || m.contains("Data truncated")) {
            return error(HttpStatus.BAD_REQUEST,
                    "Não foi possível gravar a forma de pagamento. Atualize o banco (migração V8) ou use VARCHAR(20) em orders.forma_pagamento.");
        }
        if (m.contains("clientes") && (m.contains("Duplicate") || m.contains("uk_"))) {
            if (m.toLowerCase().contains("email")) {
                return error(HttpStatus.BAD_REQUEST, "E-mail já cadastrado para esta empresa");
            }
            if (m.toLowerCase().contains("cpf")) {
                return error(HttpStatus.BAD_REQUEST, "CPF já cadastrado para esta empresa");
            }
        }
        log.warn("DataIntegrityViolationException: {}", m);
        return error(HttpStatus.BAD_REQUEST, "Violação de integridade dos dados.");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            errors.put(fe.getField(), fe.getDefaultMessage());
        }
        Map<String, Object> body = new HashMap<>();
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Validation failed");
        body.put("fields", errors);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        log.error("Erro inesperado", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Ocorreu um erro inesperado. Tente novamente.");
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", status.value());
        body.put("error", message);
        return ResponseEntity.status(status).body(body);
    }
}
