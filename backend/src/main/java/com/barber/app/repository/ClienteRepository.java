package com.barber.app.repository;

import com.barber.app.domain.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findByEmailIgnoreCase(String email);

    List<Cliente> findAllByOrderByNomeAsc();

    List<Cliente> findByNomeContainingIgnoreCaseOrderByNomeAsc(String nome);

    /** Clientes com alguma assinatura vinculada — visão do ADMIN. */
    List<Cliente> findByAssinaturaAtivaIsNotNullOrderByNomeAsc();
}
