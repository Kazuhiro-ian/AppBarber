package com.barber.app.repository;

import com.barber.app.domain.Barbeiro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BarbeiroRepository extends JpaRepository<Barbeiro, Long> {

    Optional<Barbeiro> findByEmailIgnoreCase(String email);

    List<Barbeiro> findByAtivoTrueOrderByNomeAsc();

    List<Barbeiro> findAllByOrderByNomeAsc();
}
