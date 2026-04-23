package com.veltrix.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Armazena imagens em disco local — para desenvolvimento.
 * As imagens ficam em {@code veltrix.uploads.dir}/products/{companyId}/ e
 * são servidas estaticamente em {@code /files/products/**} pelo UploadsResourceConfig.
 *
 * AVISO: Em produção (Railway) o filesystem é efêmero. Use S3StorageService.
 */
@Service
@ConditionalOnProperty(name = "veltrix.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageService.class);

    private static final long MAX_BYTES = 3 * 1024 * 1024;
    private static final Map<String, String> CONTENT_TO_EXT = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif"
    );

    @Value("${veltrix.uploads.dir:${user.home}/.veltrix/uploads}")
    private String uploadsRoot;

    @Value("${veltrix.public-base-url:}")
    private String publicBaseUrl;

    @Override
    public String store(MultipartFile file, Long companyId) {
        validateFile(file);
        String ext = resolveExt(file.getContentType());
        String name = UUID.randomUUID() + ext;
        Path dir = Path.of(uploadsRoot, "products", String.valueOf(companyId));
        try {
            Files.createDirectories(dir);
            file.transferTo(dir.resolve(name).toFile());
        } catch (IOException e) {
            log.error("Falha ao salvar imagem em disco: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao salvar imagem.");
        }
        String relativePath = "/files/products/" + companyId + "/" + name;
        String base = publicBaseUrl != null ? publicBaseUrl.trim() : "";
        return base.isEmpty() ? relativePath : base.replaceAll("/$", "") + relativePath;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo vazio.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Imagem muito grande (máx. 3 MB).");
        }
    }

    private String resolveExt(String contentType) {
        if (contentType == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de arquivo não identificado.");
        }
        String ct = contentType.toLowerCase(Locale.ROOT).split(";")[0].trim();
        String ext = CONTENT_TO_EXT.get(ct);
        if (ext == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use JPEG, PNG, WebP ou GIF.");
        }
        return ext;
    }
}
