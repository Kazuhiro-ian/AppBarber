package com.barber.app.dto.barbeiro;

import com.barber.app.dto.agendamento.AgendamentoResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Visão geral do dia para a tela inicial do barbeiro. */
public record PainelBarbeiroResponse(
        Long barbeiroId,
        String barbeiroNome,
        LocalDate data,
        long atendimentosHoje,
        long concluidosHoje,
        long pendentesHoje,
        BigDecimal faturamentoHoje,
        BigDecimal comissaoHoje,
        BigDecimal faturamentoMes,
        BigDecimal comissaoMes,
        AgendamentoResponse proximoAtendimento,
        List<AgendamentoResponse> agendaDoDia) {
}
