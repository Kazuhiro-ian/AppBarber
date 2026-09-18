package com.barber.app.dto.agendamento;

import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Pedido de agendamento. O cliente é sempre o usuário autenticado, exceto
 * quando um ADMIN informa {@code clienteId} para agendar em nome de alguém.
 */
public record AgendamentoRequest(
        @NotNull(message = "Selecione o barbeiro")
        Long barbeiroId,

        @NotNull(message = "Selecione o serviço")
        Long servicoId,

        @NotNull(message = "Informe a data")
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate data,

        @NotNull(message = "Informe o horário")
        @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
        LocalTime horario,

        /** Opcional: só é considerado quando quem agenda é um ADMIN. */
        Long clienteId) {
}
