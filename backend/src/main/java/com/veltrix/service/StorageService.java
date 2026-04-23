package com.veltrix.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {

    /**
     * Salva o arquivo e retorna a URL pública permanente.
     *
     * @param file       arquivo recebido do multipart
     * @param companyId  isolamento por empresa (usado como prefixo de path)
     * @return URL pública acessível pelo frontend
     */
    String store(MultipartFile file, Long companyId);
}
