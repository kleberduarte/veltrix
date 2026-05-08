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
 * Allowlist para VENDEDOR e TOTEM: só podem acessar rotas de PDV/vendas explicitamente listadas.
 * Tudo que não estiver na lista é negado — modelo de menor privilégio.
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

        if (!Role.VENDEDOR.name().equals(role) && !Role.TOTEM.name().equals(role)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!isAllowedForVendedorOrTotem(request)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"status\":403,\"error\":\"Acesso negado para este perfil.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Rotas permitidas para VENDEDOR e TOTEM.
     * Novos controllers são bloqueados por padrão — adicione aqui se necessário.
     */
    private boolean isAllowedForVendedorOrTotem(HttpServletRequest req) {
        String path = servletPath(req);
        String m = req.getMethod();

        // Autenticação própria
        if ("GET".equals(m)  && "/auth/me".equals(path))           return true;
        if ("POST".equals(m) && "/auth/trocar-senha".equals(path))  return true;
        if ("POST".equals(m) && "/auth/primeira-senha-convite".equals(path)) return true;
        if ("POST".equals(m) && "/auth/logout".equals(path))        return true;

        // Consulta de produtos (PDV/totem precisa listar e buscar)
        if ("GET".equals(m)  && path.startsWith("/products"))       return true;

        // Pedidos: criar e consultar os próprios
        if ("GET".equals(m)  && path.startsWith("/orders"))         return true;
        if ("POST".equals(m) && "/orders".equals(path))             return true;

        // PDV invite (totem pode verificar o seu próprio convite)
        if ("GET".equals(m)  && "/auth/pdv-invite".equals(path))    return true;

        // Parâmetros da empresa (leitura para branding/totem)
        if ("GET".equals(m)  && "/parametros-empresa".equals(path)) return true;

        // Clientes: criar e buscar (PDV)
        if ("GET".equals(m)  && path.startsWith("/clientes"))       return true;
        if ("POST".equals(m) && "/clientes".equals(path))           return true;

        // Fechamento de caixa (VENDEDOR)
        if (path.startsWith("/fechamento-caixa"))                   return true;

        // Terminais PDV: listar e heartbeat (PDV / totem)
        if ("GET".equals(m) && "/pdv-terminais".equals(path))      return true;
        if ("POST".equals(m) && path.matches("/pdv-terminais/[0-9]+/heartbeat")) return true;

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
