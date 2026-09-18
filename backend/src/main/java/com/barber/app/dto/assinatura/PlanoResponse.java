package com.barber.app.dto.assinatura;

import com.barber.app.domain.Assinatura;
import com.barber.app.domain.enums.Periodicidade;

import java.math.BigDecimal;
import java.util.List;

/** Plano exibido na tela de Serviços e Assinaturas. */
public record PlanoResponse(
        Long id,
        String nome,
        List<String> beneficios,
        BigDecimal preco,
        Periodicidade periodicidade,
        boolean ativo,
        long assinantesAtivos) {

    public static PlanoResponse de(Assinatura plano) {
        return de(plano, 0);
    }

    public static PlanoResponse de(Assinatura plano, long assinantesAtivos) {
        return new PlanoResponse(
                plano.getId(),
                plano.getNome(),
                List.copyOf(plano.getBeneficios()),
                plano.getPreco(),
                plano.getPeriodicidade(),
                plano.isAtivo(),
                assinantesAtivos);
    }
}
