package com.veltrix.controller;

import com.veltrix.dto.product.ImageUploadResponse;
import com.veltrix.service.ProductImageStorageService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductImageController {

    private final ProductImageStorageService productImageStorageService;

    @PostMapping(value = "/imagem", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageUploadResponse> upload(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        String relative = productImageStorageService.saveAndGetRelativePath(file);
        String url = productImageStorageService.buildAbsoluteUrl(relative, request);
        return ResponseEntity.ok(new ImageUploadResponse(url));
    }
}
