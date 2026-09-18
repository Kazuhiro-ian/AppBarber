package com.barber.app.dto.assinatura;

import com.barber.app.domain.Assinatura;
import com.barber.app.domain.enums.Periodicidade;
import com.barber.app.domain.enums.StatusAssinatura;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Assinatura contratada por um cliente. */
public record AssinaturaResponse(
        Long id,
        Long planoId,
        String nome,
        List<String> beneficios,
        BigDecimal preco,
        Periodicidade periodicidade,
        LocalDate dataInicio,
        LocalDate dataRenovacao,
        StatusAssinatura status,
        boolean vigente,
        long diasParaRenovacao) {

    public static AssinaturaResponse de(Assinatura a) {
        return new AssinaturaResponse(
                a.getId(),
                a.getPlano() != null ? a.getPlano().getId() : null,
                a.getNome(),
                List.copyOf(a.getBeneficios()),
                a.getPreco(),
                a.getPeriodicidade(),
                a.getDataInicio(),
                a.getDataRenovacao(),
                a.getStatus(),
                a.verificarValidade(),
                a.diasParaRenovacao());
    }
}
