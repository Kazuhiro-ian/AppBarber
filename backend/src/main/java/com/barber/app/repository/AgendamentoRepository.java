package com.barber.app.repository;

import com.barber.app.domain.Agendamento;
import com.barber.app.domain.enums.StatusAgendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    List<Agendamento> findByClienteIdOrderByDataDescHorarioDesc(Long clienteId);

    List<Agendamento> findByClienteIdAndStatusOrderByDataAscHorarioAsc(Long clienteId, StatusAgendamento status);

    List<Agendamento> findByBarbeiroIdAndDataOrderByHorarioAsc(Long barbeiroId, LocalDate data);

    List<Agendamento> findByBarbeiroIdAndDataAndStatus(Long barbeiroId, LocalDate data, StatusAgendamento status);

    List<Agendamento> findByBarbeiroIdAndDataBetweenAndStatusOrderByDataAscHorarioAsc(
            Long barbeiroId, LocalDate inicio, LocalDate fim, StatusAgendamento status);

    List<Agendamento> findByDataBetweenAndStatus(LocalDate inicio, LocalDate fim, StatusAgendamento status);

    List<Agendamento> findByDataOrderByHorarioAsc(LocalDate data);

    /** Próximos atendimentos confirmados do cliente, a partir de agora. */
    @Query("""
            select a from Agendamento a
            where a.cliente.id = :clienteId
              and a.status = com.barber.app.domain.enums.StatusAgendamento.CONFIRMADO
              and (a.data > :hoje or (a.data = :hoje and a.horario >= :agora))
            order by a.data asc, a.horario asc
            """)
    List<Agendamento> findProximosDoCliente(@Param("clienteId") Long clienteId,
                                            @Param("hoje") LocalDate hoje,
                                            @Param("agora") LocalTime agora);

    /** Receita dos atendimentos concluídos no período. */
    @Query("""
            select coalesce(sum(a.servico.preco), 0)
            from Agendamento a
            where a.status = com.barber.app.domain.enums.StatusAgendamento.CONCLUIDO
              and a.data between :inicio and :fim
            """)
    BigDecimal somarReceitaPorPeriodo(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    /** Receita concluída no período por barbeiro — base do cálculo de comissões. */
    @Query("""
            select a.barbeiro.id, a.barbeiro.nome, count(a), coalesce(sum(a.servico.preco), 0)
            from Agendamento a
            where a.status = com.barber.app.domain.enums.StatusAgendamento.CONCLUIDO
              and a.data between :inicio and :fim
            group by a.barbeiro.id, a.barbeiro.nome
            order by coalesce(sum(a.servico.preco), 0) desc
            """)
    List<Object[]> totalizarPorBarbeiro(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    /** Receita concluída no período por serviço — usado no relatório gerencial. */
    @Query("""
            select a.servico.id, a.servico.nome, count(a), coalesce(sum(a.servico.preco), 0)
            from Agendamento a
            where a.status = com.barber.app.domain.enums.StatusAgendamento.CONCLUIDO
              and a.data between :inicio and :fim
            group by a.servico.id, a.servico.nome
            order by coalesce(sum(a.servico.preco), 0) desc
            """)
    List<Object[]> totalizarPorServico(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    /** Receita concluída dia a dia — alimenta o gráfico do período. */
    @Query("""
            select a.data, coalesce(sum(a.servico.preco), 0), count(a)
            from Agendamento a
            where a.status = com.barber.app.domain.enums.StatusAgendamento.CONCLUIDO
              and a.data between :inicio and :fim
            group by a.data
            order by a.data
            """)
    List<Object[]> totalizarPorDia(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    long countByDataAndStatus(LocalDate data, StatusAgendamento status);

    long countByBarbeiroIdAndDataAndStatus(Long barbeiroId, LocalDate data, StatusAgendamento status);

    long countByDataBetweenAndStatus(LocalDate inicio, LocalDate fim, StatusAgendamento status);

    boolean existsByServicoIdAndStatus(Long servicoId, StatusAgendamento status);
}
