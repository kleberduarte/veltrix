package com.veltrix.exception;

import java.util.Collections;
import java.util.Map;

/** Erro de regra de negócio com mapa opcional de campo → mensagem (para o front destacar inputs). */
public class ValidationException extends RuntimeException {

    private final Map<String, String> fields;

    public ValidationException(String message, Map<String, String> fields) {
        super(message);
        this.fields = fields != null ? fields : Collections.emptyMap();
    }

    public Map<String, String> getFields() {
        return fields;
    }
}
