package com.barber.app.dto.barbeiro;

import com.barber.app.domain.Barbeiro;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

public record BarbeiroResponse(
        Long id,
        String nome,
        String email,
        String telefone,
        String fotoPerfil,
        List<String> especialidades,
        LocalTime horarioInicio,
        LocalTime horarioFim,
        BigDecimal comissao,
        boolean ativo) {

    public static BarbeiroResponse de(Barbeiro b) {
        return new BarbeiroResponse(
                b.getId(),
                b.getNome(),
                b.getEmail(),
                b.getTelefone(),
                b.getFotoPerfil(),
                List.copyOf(b.getEspecialidades()),
                b.getHorarioInicio(),
                b.getHorarioFim(),
                b.getComissao(),
                b.isAtivo());
    }

    /** Visão pública (tela de agendamento do cliente): sem dados de contato nem comissão. */
    public static BarbeiroResponse publico(Barbeiro b) {
        return new BarbeiroResponse(
                b.getId(),
                b.getNome(),
                null,
                null,
                b.getFotoPerfil(),
                List.copyOf(b.getEspecialidades()),
                b.getHorarioInicio(),
                b.getHorarioFim(),
                null,
                b.isAtivo());
    }
}
