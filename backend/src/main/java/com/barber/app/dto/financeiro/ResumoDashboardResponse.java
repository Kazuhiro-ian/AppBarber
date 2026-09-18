package com.barber.app.dto.financeiro;

import java.math.BigDecimal;

/** Indicadores do topo do painel administrativo. */
public record ResumoDashboardResponse(
        long agendamentosHoje,
        long agendamentosConcluidosHoje,
        long agendamentosMes,
        BigDecimal faturamentoHoje,
        BigDecimal faturamentoMes,
        BigDecimal despesasMes,
        BigDecimal saldoMes,
        long produtosEmEstoqueBaixo,
        long barbeirosAtivos,
        long clientesComAssinatura) {
}
