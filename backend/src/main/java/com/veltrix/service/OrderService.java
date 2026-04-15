package com.veltrix.service;

import com.veltrix.dto.order.*;
import com.veltrix.model.*;
import com.veltrix.model.enums.FormaPagamento;
import com.veltrix.repository.*;
import com.veltrix.security.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final PmcReferenciaRepository pmcReferenciaRepository;
    private final CashFlowService cashFlowService;
    private final ProductService productService;

    public List<OrderResponse> findAll() {
        return orderRepository.findByCompanyIdOrderByCreatedAtDesc(TenantContext.getCompanyId())
                .stream().map(this::toResponse).toList();
    }

    public List<OrderResponse> findByDateRange(LocalDate from, LocalDate to) {
        Long companyId = TenantContext.getCompanyId();
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();
        return orderRepository.findByCompanyIdAndCreatedAtBetween(companyId, start, end).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public OrderResponse create(OrderRequest request) {
        Long companyId = TenantContext.getCompanyId();

        FormaPagamento fp = request.getFormaPagamento() != null ? request.getFormaPagamento() : FormaPagamento.DINHEIRO;
        int parcelasVal = request.getParcelas() != null ? request.getParcelas() : 1;
        if (fp != FormaPagamento.CARTAO) {
            parcelasVal = 1;
        }

        Order order = Order.builder()
                .companyId(companyId)
                .formaPagamento(fp)
                .parcelas(parcelasVal)
                .chavePix(request.getChavePix())
                .cpfCliente(request.getCpfCliente())
                .clienteId(request.getClienteId())
                .desconto(request.getDesconto() != null ? request.getDesconto() : BigDecimal.ZERO)
                .build();

        List<OrderItem> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findByIdAndCompanyId(itemReq.getProductId(), companyId)
                    .orElseThrow(() -> new EntityNotFoundException("Produto não encontrado: " + itemReq.getProductId()));

            if (product.getStock() < itemReq.getQuantity()) {
                throw new IllegalArgumentException("Estoque insuficiente para: " + product.getName());
            }

            BigDecimal itemSubtotal = productService.calcularPrecoEfetivo(product, itemReq.getQuantity());
            subtotal = subtotal.add(itemSubtotal);

            // Validação PMC
            String pmcStatus = validarPmc(companyId, product, product.getPrice());

            OrderItem item = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .price(product.getPrice())
                    .loteCodigo(itemReq.getLoteCodigo())
                    .loteValidade(itemReq.getLoteValidade())
                    .receitaTipo(itemReq.getReceitaTipo())
                    .receitaNumero(itemReq.getReceitaNumero())
                    .receitaPrescritor(itemReq.getReceitaPrescritor())
                    .receitaData(itemReq.getReceitaData())
                    .pmcStatus(pmcStatus)
                    .build();
            items.add(item);

            // Decrementar estoque
            product.setStock(product.getStock() - itemReq.getQuantity());
            productRepository.save(product);
        }

        BigDecimal desconto = order.getDesconto();
        BigDecimal total = subtotal.subtract(desconto).max(BigDecimal.ZERO);

        order.setSubtotal(subtotal);
        order.setTotal(total);
        order.setItems(items);

        Order saved = orderRepository.save(order);
        cashFlowService.recordCredit(companyId, total, "Venda #" + saved.getId());

        return toResponse(saved);
    }

    private String validarPmc(Long companyId, Product product, BigDecimal preco) {
        if (product.getRegistroMs() == null && product.getGtinEan() == null) return "OK";
        var pmcOpt = pmcReferenciaRepository.findVigente(
                companyId, product.getRegistroMs(), product.getGtinEan(), java.time.LocalDate.now());
        if (pmcOpt.isEmpty()) return "OK";
        int cmp = preco.compareTo(pmcOpt.get().getPmc());
        if (cmp > 0) return "VIOLACAO";
        if (cmp == 0) return "AVISO";
        return "OK";
    }

    private OrderResponse toResponse(Order o) {
        OrderResponse r = new OrderResponse();
        r.setId(o.getId());
        r.setSubtotal(o.getSubtotal());
        r.setDesconto(o.getDesconto());
        r.setTotal(o.getTotal());
        r.setStatus(o.getStatus());
        r.setFormaPagamento(o.getFormaPagamento());
        r.setParcelas(o.getParcelas());
        r.setCpfCliente(o.getCpfCliente());
        r.setClienteId(o.getClienteId());
        r.setNomeOperador(o.getNomeOperador());
        r.setCreatedAt(o.getCreatedAt());
        r.setItems(o.getItems().stream().map(item -> {
            OrderResponse.OrderItemResponse ir = new OrderResponse.OrderItemResponse();
            ir.setProductId(item.getProduct().getId());
            ir.setProductName(item.getProduct().getName());
            ir.setQuantity(item.getQuantity());
            ir.setPrice(item.getPrice());
            ir.setSubtotal(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            ir.setLoteCodigo(item.getLoteCodigo());
            ir.setPmcStatus(item.getPmcStatus());
            return ir;
        }).toList());
        return r;
    }
}
