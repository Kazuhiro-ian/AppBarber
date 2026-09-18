package com.barber.app.dto.servico;

import com.barber.app.domain.Servico;

import java.math.BigDecimal;

public record ServicoResponse(
        Long id,
        String nome,
        String categoria,
        int duracaoMinutos,
        BigDecimal preco,
        boolean ativo) {

    public static ServicoResponse de(Servico servico) {
        return new ServicoResponse(
                servico.getId(),
                servico.getNome(),
                servico.getCategoria(),
                servico.getDuracaoMinutos(),
                servico.getPreco(),
                servico.isAtivo());
    }
}
