package com.veltrix.repository;

import com.veltrix.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    Optional<Company> findByPdvInviteCodeIgnoreCase(String pdvInviteCode);
    Optional<Company> findByOnboardingToken(String onboardingToken);
    Optional<Company> findByAccessToken(String accessToken);
}
