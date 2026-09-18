package com.barber.app.dto.financeiro;

import java.math.BigDecimal;

public record ComparativoPeriodosResponse(
        ResumoFinanceiroResponse periodoA,
        ResumoFinanceiroResponse periodoB,
        BigDecimal variacaoGanhos,
        BigDecimal variacaoGastos,
        BigDecimal variacaoSaldo) {
}
