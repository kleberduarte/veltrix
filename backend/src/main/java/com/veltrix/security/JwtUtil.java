package com.veltrix.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${veltrix.jwt.secret}")
    private String secret;

    @Value("${veltrix.jwt.expiration}")
    private long expiration;

    private SecretKey getKey() {
        byte[] keyBytes = java.util.Base64.getEncoder().encodeToString(secret.getBytes()).getBytes();
        return Keys.hmacShaKeyFor(io.jsonwebtoken.io.Decoders.BASE64.decode(
                java.util.Base64.getEncoder().encodeToString(secret.getBytes())));
    }

    public String generateToken(Long userId, Long companyId, String email, String role) {
        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .claim("companyId", companyId)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey())
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenValid(String token) {
        try { extractClaims(token); return true; }
        catch (JwtException | IllegalArgumentException e) { return false; }
    }

    public String extractEmail(String token)     { return extractClaims(token).getSubject(); }
    public Long   extractCompanyId(String token) { return extractClaims(token).get("companyId", Long.class); }
    public Long   extractUserId(String token)    { return extractClaims(token).get("userId", Long.class); }
    public String extractRole(String token)      { return extractClaims(token).get("role", String.class); }
}
