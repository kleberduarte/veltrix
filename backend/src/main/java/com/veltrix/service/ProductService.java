package com.veltrix.service;

import com.veltrix.dto.product.*;
import com.veltrix.model.Product;
import com.veltrix.repository.ProductRepository;
import com.veltrix.security.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    public List<ProductResponse> findAll() {
        return productRepository.findByCompanyIdAndActiveTrue(TenantContext.getCompanyId())
                .stream().map(this::toResponse).toList();
    }

    public List<ProductResponse> findByCategoria(String categoria) {
        return productRepository.findByCompanyIdAndActiveTrue(TenantContext.getCompanyId())
                .stream()
                .filter(p -> categoria.equalsIgnoreCase(p.getCategoria()))
                .map(this::toResponse).toList();
    }

    public List<String> listCategorias() {
        return productRepository.findByCompanyIdAndActiveTrue(TenantContext.getCompanyId())
                .stream()
                .map(Product::getCategoria)
                .filter(c -> c != null && !c.isBlank())
                .distinct().sorted().toList();
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Long companyId = TenantContext.getCompanyId();
        Product product = Product.builder()
                .companyId(companyId)
                .codigoProduto(request.getCodigoProduto())
                .gtinEan(request.getGtinEan())
                .name(request.getName())
                .descricao(request.getDescricao())
                .categoria(request.getCategoria())
                .price(request.getPrice())
                .precoPromocional(request.getPrecoPromocional())
                .promocaoInicio(request.getPromocaoInicio())
                .promocaoFim(request.getPromocaoFim())
                .emPromocao(Boolean.TRUE.equals(request.getEmPromocao()))
                .promoQtdLevar(request.getPromoQtdLevar() != null ? request.getPromoQtdLevar() : 0)
                .promoQtdPagar(request.getPromoQtdPagar() != null ? request.getPromoQtdPagar() : 0)
                .stock(request.getStock() != null ? request.getStock() : 0)
                .estoqueMinimo(request.getEstoqueMinimo() != null ? request.getEstoqueMinimo() : 0)
                .tipo(request.getTipo())
                .tipoControle(request.getTipoControle())
                .exigeReceita(Boolean.TRUE.equals(request.getExigeReceita()))
                .exigeLote(Boolean.TRUE.equals(request.getExigeLote()))
                .exigeValidade(Boolean.TRUE.equals(request.getExigeValidade()))
                .registroMs(request.getRegistroMs())
                .pmc(request.getPmc())
                .build();
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = productRepository.findByIdAndCompanyId(id, TenantContext.getCompanyId())
                .orElseThrow(() -> new EntityNotFoundException("Produto não encontrado"));
        product.setName(request.getName());
        product.setCodigoProduto(request.getCodigoProduto());
        product.setGtinEan(request.getGtinEan());
        product.setDescricao(request.getDescricao());
        product.setCategoria(request.getCategoria());
        product.setPrice(request.getPrice());
        product.setPrecoPromocional(request.getPrecoPromocional());
        product.setPromocaoInicio(request.getPromocaoInicio());
        product.setPromocaoFim(request.getPromocaoFim());
        product.setEmPromocao(Boolean.TRUE.equals(request.getEmPromocao()));
        product.setPromoQtdLevar(request.getPromoQtdLevar() != null ? request.getPromoQtdLevar() : 0);
        product.setPromoQtdPagar(request.getPromoQtdPagar() != null ? request.getPromoQtdPagar() : 0);
        product.setStock(request.getStock() != null ? request.getStock() : 0);
        product.setEstoqueMinimo(request.getEstoqueMinimo() != null ? request.getEstoqueMinimo() : 0);
        product.setTipo(request.getTipo());
        product.setTipoControle(request.getTipoControle());
        product.setExigeReceita(Boolean.TRUE.equals(request.getExigeReceita()));
        product.setExigeLote(Boolean.TRUE.equals(request.getExigeLote()));
        product.setExigeValidade(Boolean.TRUE.equals(request.getExigeValidade()));
        product.setRegistroMs(request.getRegistroMs());
        product.setPmc(request.getPmc());
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public void delete(Long id) {
        Product product = productRepository.findByIdAndCompanyId(id, TenantContext.getCompanyId())
                .orElseThrow(() -> new EntityNotFoundException("Produto não encontrado"));
        product.setActive(false);
        productRepository.save(product);
    }

    @Transactional
    public int deleteAllFromCurrentCompany() {
        Long companyId = TenantContext.getCompanyId();
        if (companyId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida.");
        }
        return productRepository.deactivateAllByCompanyId(companyId);
    }

    public BigDecimal calcularPrecoEfetivo(Product p, int quantidade) {
        BigDecimal base = p.getPrice();
        LocalDate hoje = LocalDate.now();
        boolean emPromo = Boolean.TRUE.equals(p.getEmPromocao()) ||
                (p.getPromocaoInicio() != null && p.getPromocaoFim() != null &&
                 !hoje.isBefore(p.getPromocaoInicio()) && !hoje.isAfter(p.getPromocaoFim()));

        if (emPromo && p.getPrecoPromocional() != null) {
            base = p.getPrecoPromocional();
        }

        // Leve X Pague Y
        int levar = p.getPromoQtdLevar() != null ? p.getPromoQtdLevar() : 0;
        int pagar = p.getPromoQtdPagar() != null ? p.getPromoQtdPagar() : 0;
        if (levar > 0 && pagar > 0 && quantidade >= levar) {
            int grupos = quantidade / levar;
            int restante = quantidade % levar;
            int unitsPagar = grupos * pagar + restante;
            return base.multiply(BigDecimal.valueOf(unitsPagar));
        }

        return base.multiply(BigDecimal.valueOf(quantidade));
    }

    public ProductResponse toResponse(Product p) {
        ProductResponse r = new ProductResponse();
        r.setId(p.getId());
        r.setName(p.getName());
        r.setCodigoProduto(p.getCodigoProduto());
        r.setGtinEan(p.getGtinEan());
        r.setDescricao(p.getDescricao());
        r.setCategoria(p.getCategoria());
        r.setPrice(p.getPrice());
        r.setPrecoPromocional(p.getPrecoPromocional());
        r.setPromocaoInicio(p.getPromocaoInicio());
        r.setPromocaoFim(p.getPromocaoFim());
        r.setEmPromocao(p.getEmPromocao());
        r.setPromoQtdLevar(p.getPromoQtdLevar());
        r.setPromoQtdPagar(p.getPromoQtdPagar());
        r.setStock(p.getStock());
        r.setEstoqueMinimo(p.getEstoqueMinimo());
        r.setActive(p.getActive());
        r.setTipo(p.getTipo());
        r.setTipoControle(p.getTipoControle());
        r.setExigeReceita(p.getExigeReceita());
        r.setExigeLote(p.getExigeLote());
        r.setExigeValidade(p.getExigeValidade());
        r.setRegistroMs(p.getRegistroMs());
        r.setPmc(p.getPmc());
        r.setPrecoEfetivo(calcularPrecoEfetivo(p, 1));
        r.setCreatedAt(p.getCreatedAt());
        return r;
    }
}
