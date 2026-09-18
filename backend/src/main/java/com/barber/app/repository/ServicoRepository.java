package com.barber.app.repository;

import com.barber.app.domain.Servico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServicoRepository extends JpaRepository<Servico, Long> {

    List<Servico> findByAtivoTrueOrderByNomeAsc();

    List<Servico> findByCategoriaIgnoreCaseOrderByNomeAsc(String categoria);

    boolean existsByNomeIgnoreCase(String nome);
}
