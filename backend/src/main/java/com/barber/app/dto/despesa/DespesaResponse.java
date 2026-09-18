package com.barber.app.dto.despesa;

import com.barber.app.domain.Despesa;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DespesaResponse(
        Long id,
        String categoria,
        BigDecimal valor,
        LocalDate data,
        String descricao,
        Long barbeiroId,
        String barbeiroNome) {

    public static DespesaResponse de(Despesa d) {
        return new DespesaResponse(
                d.getId(),
                d.getCategoria(),
                d.getValor(),
                d.getData(),
                d.getDescricao(),
                d.getBarbeiro() != null ? d.getBarbeiro().getId() : null,
                d.getBarbeiro() != null ? d.getBarbeiro().getNome() : null);
    }
}
