package com.barber.app.repository;

import com.barber.app.domain.Assinatura;
import com.barber.app.domain.enums.StatusAssinatura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AssinaturaRepository extends JpaRepository<Assinatura, Long> {

    /** Catálogo de planos (o que o cliente vê na tela de assinaturas). */
    List<Assinatura> findByModeloTrueAndAtivoTrueOrderByPrecoAsc();

    /** Catálogo completo, incluindo planos desativados — visão do ADMIN. */
    List<Assinatura> findByModeloTrueOrderByPrecoAsc();

    Optional<Assinatura> findByIdAndModeloTrue(Long id);

    boolean existsByNomeIgnoreCaseAndModeloTrue(String nome);

    /** Assinaturas de clientes originadas de um plano do catálogo. */
    long countByPlanoIdAndStatus(Long planoId, StatusAssinatura status);

    /** Receita de assinaturas cujo início caiu dentro do período. */
    @Query("""
            select coalesce(sum(a.preco), 0)
            from Assinatura a
            where a.modelo = false
              and a.dataInicio between :inicio and :fim
            """)
    BigDecimal somarReceitaPorPeriodo(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);
}
