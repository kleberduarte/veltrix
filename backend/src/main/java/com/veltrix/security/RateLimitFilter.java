package com.veltrix.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate limiting simples em memória por IP.
 * Janela deslizante de 1 minuto com limite por endpoint.
 */
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    private record WindowEntry(AtomicInteger count, Instant windowStart) {}

    private final Map<String, WindowEntry> counters = new ConcurrentHashMap<>();

    private static final long WINDOW_MS = 60_000;

    /** Retorna o limite de requisições/minuto para o caminho. -1 = sem limite. */
    private int limitFor(String path, String method) {
        if ("POST".equals(method)) {
            if ("/auth/login".equals(path))               return 10;
            if ("/auth/register".equals(path))            return 5;
            if ("/auth/email-status".equals(path))        return 20;
            if ("/auth/definir-senha-inicial".equals(path)) return 10;
        }
        return -1;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();
        int limit = limitFor(path, method);

        if (limit > 0) {
            String ip = resolveIp(request);
            String key = ip + ":" + method + ":" + path;
            Instant now = Instant.now();

            WindowEntry entry = counters.compute(key, (k, existing) -> {
                if (existing == null || now.toEpochMilli() - existing.windowStart().toEpochMilli() > WINDOW_MS) {
                    return new WindowEntry(new AtomicInteger(1), now);
                }
                existing.count().incrementAndGet();
                return existing;
            });

            if (entry.count().get() > limit) {
                response.setStatus(429);
                response.setContentType("application/json;charset=UTF-8");
                response.setHeader("Retry-After", "60");
                response.getWriter().write("{\"status\":429,\"error\":\"Muitas tentativas. Aguarde 1 minuto.\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private String resolveIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
