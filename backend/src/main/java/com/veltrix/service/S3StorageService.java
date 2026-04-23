package com.veltrix.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URI;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Armazena imagens em S3-compatível (AWS S3, Cloudflare R2, MinIO, Backblaze B2).
 *
 * Ative com: VELTRIX_STORAGE_TYPE=s3
 * Variáveis obrigatórias: S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY
 * Variável opcional: S3_ENDPOINT_URL (para R2/MinIO — omitir para AWS S3 padrão)
 * Variável opcional: S3_PUBLIC_BASE_URL (CDN custom; se omitido usa URL padrão do bucket)
 */
@Service
@ConditionalOnProperty(name = "veltrix.storage.type", havingValue = "s3")
public class S3StorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(S3StorageService.class);

    private static final long MAX_BYTES = 3 * 1024 * 1024;
    private static final Map<String, String> CONTENT_TO_EXT = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif"
    );

    private final S3Client s3;
    private final String bucket;
    private final String publicBaseUrl;

    public S3StorageService(
            @Value("${veltrix.s3.bucket}") String bucket,
            @Value("${veltrix.s3.region}") String region,
            @Value("${veltrix.s3.access-key}") String accessKey,
            @Value("${veltrix.s3.secret-key}") String secretKey,
            @Value("${veltrix.s3.endpoint-url:}") String endpointUrl,
            @Value("${veltrix.s3.public-base-url:}") String publicBaseUrl
    ) {
        this.bucket = bucket;
        this.publicBaseUrl = publicBaseUrl.trim();

        var builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)));

        if (!endpointUrl.isBlank()) {
            builder.endpointOverride(URI.create(endpointUrl));
            // R2/MinIO exigem path-style access
            builder.serviceConfiguration(c -> c.pathStyleAccessEnabled(true));
        }

        this.s3 = builder.build();
    }

    @Override
    public String store(MultipartFile file, Long companyId) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo vazio.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Imagem muito grande (máx. 3 MB).");
        }

        String ct = resolveContentType(file.getContentType());
        String ext = CONTENT_TO_EXT.get(ct);
        if (ext == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use JPEG, PNG, WebP ou GIF.");
        }

        String key = "products/" + companyId + "/" + UUID.randomUUID() + ext;

        try {
            s3.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType(ct)
                            .contentLength(file.getSize())
                            .build(),
                    RequestBody.fromBytes(file.getBytes())
            );
        } catch (IOException e) {
            log.error("Falha ao fazer upload para S3: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao salvar imagem.");
        }

        if (!publicBaseUrl.isEmpty()) {
            return publicBaseUrl.replaceAll("/$", "") + "/" + key;
        }
        // URL padrão AWS S3
        return "https://" + bucket + ".s3.amazonaws.com/" + key;
    }

    private String resolveContentType(String contentType) {
        if (contentType == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de arquivo não identificado.");
        }
        return contentType.toLowerCase(Locale.ROOT).split(";")[0].trim();
    }
}
