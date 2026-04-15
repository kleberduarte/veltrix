package com.veltrix.repository;

import com.veltrix.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByCompany_IdOrderByIdAsc(Long companyId);

    boolean existsByEmailAndIdNot(String email, Long id);

    /** Anula o vínculo com terminal PDV de todos os usuários de uma empresa antes de deletar os terminais. */
    @Modifying
    @Query("UPDATE User u SET u.pdvTerminal = null WHERE u.company.id = :companyId")
    void desvinculaTerminaisDeEmpresa(@Param("companyId") Long companyId);

    void deleteByCompany_Id(Long companyId);
}
