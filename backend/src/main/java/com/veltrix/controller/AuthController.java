package com.veltrix.controller;

import com.veltrix.dto.auth.*;
import com.veltrix.model.BlacklistedToken;
import com.veltrix.repository.BlacklistedTokenRepository;
import com.veltrix.security.JwtUtil;
import com.veltrix.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;
    private final BlacklistedTokenRepository blacklistedTokenRepository;

    @Value("${veltrix.jwt.expiration:86400000}")
    private long jwtExpiration;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request,
                                                  HttpServletResponse response) {
        AuthResponse auth = authService.register(request);
        setAuthCookie(response, auth.getToken());
        return ResponseEntity.ok(auth);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                               HttpServletResponse response) {
        AuthResponse auth = authService.login(request);
        setAuthCookie(response, auth.getToken());
        return ResponseEntity.ok(auth);
    }

    @PostMapping("/email-status")
    public ResponseEntity<EmailStatusResponse> emailStatus(@Valid @RequestBody EmailLookupRequest request) {
        return ResponseEntity.ok(authService.getEmailStatus(request));
    }

    @PostMapping("/definir-senha-inicial")
    public ResponseEntity<AuthResponse> definirSenhaInicial(@Valid @RequestBody SetupInitialPasswordRequest request,
                                                             HttpServletResponse response) {
        AuthResponse auth = authService.setupInitialPassword(request);
        setAuthCookie(response, auth.getToken());
        return ResponseEntity.ok(auth);
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(Authentication auth) {
        return ResponseEntity.ok(authService.getMe(auth.getName()));
    }

    @GetMapping("/companies")
    public ResponseEntity<List<CompanySummaryResponse>> listCompanies() {
        return ResponseEntity.ok(authService.listCompaniesForSelector());
    }

    @PostMapping("/companies")
    public ResponseEntity<CompanySummaryResponse> createCompany(@Valid @RequestBody CreateCompanyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.createCompany(request.getName()));
    }

    @DeleteMapping("/companies/{id}")
    public ResponseEntity<Void> deleteCompany(@PathVariable Long id) {
        authService.deleteCompany(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/company-access/{token}")
    public ResponseEntity<CompanyAccessResponse> companyAccessInfo(@PathVariable String token) {
        return ResponseEntity.ok(authService.getCompanyAccessInfo(token));
    }

    @PostMapping("/switch-company")
    public ResponseEntity<AuthResponse> switchCompany(@Valid @RequestBody SwitchCompanyRequest request,
                                                       HttpServletRequest httpRequest,
                                                       HttpServletResponse httpResponse) {
        String ip = resolveClientIp(httpRequest);
        AuthResponse auth = authService.switchCompany(request.getCompanyId(), ip);
        setAuthCookie(httpResponse, auth.getToken());
        return ResponseEntity.ok(auth);
    }

    @GetMapping("/pdv-invite")
    public ResponseEntity<PdvInviteResponse> getPdvInvite() {
        return ResponseEntity.ok(authService.getPdvInviteCode());
    }

    @PostMapping("/pdv-invite")
    public ResponseEntity<PdvInviteResponse> regeneratePdvInvite() {
        return ResponseEntity.ok(authService.regeneratePdvInviteCode());
    }

    @PostMapping("/users")
    public ResponseEntity<CreateUserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.createUser(request));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(authService.updateUser(id, request));
    }

    @PostMapping("/trocar-senha")
    public ResponseEntity<AuthResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                                        Authentication auth,
                                                        HttpServletResponse response) {
        AuthResponse authResp = authService.changePassword(request, auth.getName());
        setAuthCookie(response, authResp.getToken());
        return ResponseEntity.ok(authResp);
    }

    @PostMapping("/primeira-senha-convite")
    public ResponseEntity<AuthResponse> definirPrimeiraSenhaConvite(
            @Valid @RequestBody PrimeiraSenhaConviteRequest request,
            Authentication auth,
            HttpServletResponse response) {
        AuthResponse authResp = authService.definirPrimeiraSenhaConvite(request, auth.getName());
        setAuthCookie(response, authResp.getToken());
        return ResponseEntity.ok(authResp);
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> listUsers() {
        return ResponseEntity.ok(authService.listUsers());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        authService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String token = extractTokenFromRequest(request);
        if (token != null && jwtUtil.isTokenValid(token)) {
            String jti = jwtUtil.extractJti(token);
            if (jti != null && !blacklistedTokenRepository.existsByJti(jti)) {
                blacklistedTokenRepository.save(BlacklistedToken.builder()
                        .jti(jti)
                        .expiresAt(jwtUtil.extractExpiration(token).toInstant())
                        .build());
            }
        }
        clearAuthCookie(response);
        return ResponseEntity.noContent().build();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private void setAuthCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("veltrix_token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // true em produção (HTTPS); Next.js proxy pode sobrescrever
        cookie.setPath("/");
        cookie.setMaxAge((int) (jwtExpiration / 1000));
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }

    private void clearAuthCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("veltrix_token", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if ("veltrix_token".equals(c.getName())) return c.getValue();
            }
        }
        return null;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
