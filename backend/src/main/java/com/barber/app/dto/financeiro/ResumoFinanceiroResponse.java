package com.barber.app.dto.financeiro;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Retorno de {@code GestaoFinanceiraService} — não é uma entidade persistida. */
public record ResumoFinanceiroResponse(
        LocalDate periodoInicio,
        LocalDate periodoFim,
        BigDecimal ganhos,
        BigDecimal gastos,
        BigDecimal saldoLiquido) {
}
