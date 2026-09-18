package com.barber.app.dto.barbeiro;

import com.barber.app.dto.agendamento.AgendamentoResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Agenda de um barbeiro em um dia, já com os totalizadores que o painel exibe.
 *
 * @param faturamentoPrevisto soma dos serviços confirmados + concluídos
 * @param faturamentoRealizado soma apenas dos atendimentos concluídos
 */
public record AgendaDiaResponse(
        Long barbeiroId,
        String barbeiroNome,
        LocalDate data,
        LocalTime horarioInicio,
        LocalTime horarioFim,
        long totalConfirmados,
        long totalConcluidos,
        long totalCancelados,
        BigDecimal faturamentoPrevisto,
        BigDecimal faturamentoRealizado,
        BigDecimal comissaoPrevista,
        List<AgendamentoResponse> agendamentos) {
}
