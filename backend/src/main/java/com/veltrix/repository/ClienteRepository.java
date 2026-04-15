package com.veltrix.repository;

import com.veltrix.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    List<Cliente> findByCompanyIdOrderByNomeAsc(Long companyId);

    Optional<Cliente> findByIdAndCompanyId(Long id, Long companyId);

    @Query("SELECT c FROM Cliente c WHERE c.companyId = :cid AND (" +
           "LOWER(c.nome) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "c.cpf LIKE CONCAT('%',:q,'%') OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "c.telefone LIKE CONCAT('%',:q,'%') OR " +
           "c.cep LIKE CONCAT('%',:q,'%') OR " +
           "(c.codigoConvitePdv IS NOT NULL AND LOWER(c.codigoConvitePdv) LIKE LOWER(CONCAT('%',:q,'%'))))")
    List<Cliente> search(@Param("cid") Long companyId, @Param("q") String q);

    boolean existsByCompanyIdAndEmailIgnoreCase(Long companyId, String email);

    boolean existsByCompanyIdAndCpf(Long companyId, String cpf);

    boolean existsByCompanyIdAndEmailIgnoreCaseAndIdNot(Long companyId, String email, Long id);

    boolean existsByCompanyIdAndCpfAndIdNot(Long companyId, String cpf, Long id);

    void deleteByCompanyId(Long companyId);
}
