package com.barber.app.dto.barbeiro;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Comissão de um barbeiro em um período, calculada sobre atendimentos concluídos. */
public record ComissaoResponse(
        Long barbeiroId,
        String barbeiroNome,
        LocalDate periodoInicio,
        LocalDate periodoFim,
        long atendimentosConcluidos,
        BigDecimal faturamento,
        BigDecimal percentualComissao,
        BigDecimal valorComissao) {
}
