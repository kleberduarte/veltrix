package com.veltrix.dto.product;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageUploadResponse {
    /** URL absoluta para usar em imagemUrl do produto (totem, PDV, etc.). */
    private String url;
}
