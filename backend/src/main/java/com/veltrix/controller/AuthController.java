package com.veltrix.controller;

import com.veltrix.dto.auth.*;
import com.veltrix.dto.auth.OnboardingInfoResponse;
import com.veltrix.dto.auth.RegisterAdminRequest;
import com.veltrix.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
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

    @GetMapping("/companies/{id}/onboarding")
    public ResponseEntity<CompanySummaryResponse> getCompanyOnboarding(@PathVariable Long id) {
        return ResponseEntity.ok(authService.getCompanyOnboarding(id));
    }

    @PostMapping("/companies/{id}/onboarding")
    public ResponseEntity<CompanySummaryResponse> regenerateOnboarding(@PathVariable Long id) {
        return ResponseEntity.ok(authService.regenerateOnboardingToken(id));
    }

    @GetMapping("/onboarding/{token}")
    public ResponseEntity<OnboardingInfoResponse> onboardingInfo(@PathVariable String token) {
        return ResponseEntity.ok(authService.getOnboardingInfo(token));
    }

    @PostMapping("/onboarding/{token}")
    public ResponseEntity<AuthResponse> onboardingRegister(
            @PathVariable String token,
            @Valid @RequestBody RegisterAdminRequest request) {
        return ResponseEntity.ok(authService.registerViaOnboarding(token, request));
    }

    @PostMapping("/switch-company")
    public ResponseEntity<AuthResponse> switchCompany(@Valid @RequestBody SwitchCompanyRequest request) {
        return ResponseEntity.ok(authService.switchCompany(request.getCompanyId()));
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
                                                        Authentication auth) {
        return ResponseEntity.ok(authService.changePassword(request, auth.getName()));
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
}
