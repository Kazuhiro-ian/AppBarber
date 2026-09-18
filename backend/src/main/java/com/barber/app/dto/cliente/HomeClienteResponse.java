package com.barber.app.dto.cliente;

import com.barber.app.dto.agendamento.AgendamentoResponse;
import com.barber.app.dto.assinatura.AssinaturaResponse;

import java.math.BigDecimal;
import java.util.List;

/** Tudo que a Home do Cliente precisa em uma única chamada. */
public record HomeClienteResponse(
        String nome,
        String fotoPerfil,
        AgendamentoResponse proximoAgendamento,
        List<AgendamentoResponse> proximosAgendamentos,
        long totalAtendimentos,
        BigDecimal totalGasto,
        AssinaturaResponse assinatura) {
}
