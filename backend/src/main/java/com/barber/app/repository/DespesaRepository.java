package com.barber.app.repository;

import com.barber.app.domain.Despesa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface DespesaRepository extends JpaRepository<Despesa, Long> {

    List<Despesa> findByDataBetweenOrderByDataDesc(LocalDate inicio, LocalDate fim);

    List<Despesa> findByCategoriaIgnoreCaseOrderByDataDesc(String categoria);

    List<Despesa> findByBarbeiroIdOrderByDataDesc(Long barbeiroId);

    List<Despesa> findAllByOrderByDataDesc();

    @Query("""
            select coalesce(sum(d.valor), 0)
            from Despesa d
            where d.data between :inicio and :fim
            """)
    BigDecimal somarPorPeriodo(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    /** Gastos do período agrupados por categoria — usado no relatório gerencial. */
    @Query("""
            select d.categoria, count(d), coalesce(sum(d.valor), 0)
            from Despesa d
            where d.data between :inicio and :fim
            group by d.categoria
            order by coalesce(sum(d.valor), 0) desc
            """)
    List<Object[]> totalizarPorCategoria(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    /** Categorias já utilizadas, para sugerir no formulário. */
    @Query("select distinct d.categoria from Despesa d order by d.categoria")
    List<String> listarCategorias();
}
