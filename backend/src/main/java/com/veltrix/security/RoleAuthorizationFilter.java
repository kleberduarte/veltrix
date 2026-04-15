package com.veltrix.security;

import com.veltrix.model.enums.Role;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Restringe o perfil {@link Role#VENDEDOR} a rotinas de PDV e vendas (não cadastra produtos, relatórios, OS, etc.).
 */
@Component
@RequiredArgsConstructor
public class RoleAuthorizationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            filterChain.doFilter(request, response);
            return;
        }

        String role = auth.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .findFirst()
                .orElse(null);

        if (!Role.VENDEDOR.name().equals(role)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (isDeniedForVendedor(request)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"status\":403,\"error\":\"Acesso negado para o perfil vendedor.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isDeniedForVendedor(HttpServletRequest req) {
        String path = servletPath(req);
        String m = req.getMethod();
        if (path.startsWith("/reports")) return true;
        if (path.startsWith("/auth/users")) return true;
        if (path.startsWith("/auth/companies")) return true;
        if (path.startsWith("/ordens-servico")) return true;
        if ("POST".equals(m) && "/parametros-empresa".equals(path)) return true;
        if ("POST".equals(m) && "/products".equals(path)) return true;
        if (("PUT".equals(m) || "DELETE".equals(m)) && path.startsWith("/products")) return true;
        return false;
    }

    private static String servletPath(HttpServletRequest req) {
        String uri = req.getRequestURI();
        String ctx = req.getContextPath();
        if (ctx != null && !ctx.isEmpty() && uri.startsWith(ctx)) {
            return uri.substring(ctx.length());
        }
        return uri;
    }
}
