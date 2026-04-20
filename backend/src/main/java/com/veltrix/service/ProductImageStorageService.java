package com.veltrix.service;

import com.veltrix.security.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
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

@Service
public class ProductImageStorageService {

    private static final long MAX_BYTES = 3 * 1024 * 1024; // 3 MB

    private static final Map<String, String> CONTENT_TO_EXT = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif"
    );

    @Value("${veltrix.uploads.dir:${user.home}/.veltrix/uploads}")
    private String uploadsRoot;

    /**
     * URL base pública da API (ex.: https://api.empresa.com). Se vazio, o controller monta a partir do request.
     */
    @Value("${veltrix.public-base-url:}")
    private String publicBaseUrl;

    public String saveAndGetRelativePath(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo vazio.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Imagem muito grande (máx. 3 MB).");
        }
        String ct = file.getContentType();
        if (ct == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de arquivo não identificado.");
        }
        ct = ct.toLowerCase(Locale.ROOT).split(";")[0].trim();
        String ext = CONTENT_TO_EXT.get(ct);
        if (ext == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use JPEG, PNG, WebP ou GIF.");
        }

        Long companyId = TenantContext.getCompanyId();
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida.");
        }

        String name = UUID.randomUUID() + ext;
        Path dir = Path.of(uploadsRoot, "products", String.valueOf(companyId));
        try {
            Files.createDirectories(dir);
            Path target = dir.resolve(name);
            file.transferTo(target.toFile());
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao salvar imagem.");
        }

        return "/files/products/" + companyId + "/" + name;
    }

    public String buildAbsoluteUrl(String relativePath, HttpServletRequest request) {
        String base = publicBaseUrl != null ? publicBaseUrl.trim() : "";
        if (base.isEmpty()) {
            String scheme = request.getScheme();
            String host = request.getServerName();
            int port = request.getServerPort();
            boolean defPort = ("http".equals(scheme) && port == 80) || ("https".equals(scheme) && port == 443);
            base = scheme + "://" + host + (defPort ? "" : ":" + port);
        }
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base + relativePath;
    }
}
