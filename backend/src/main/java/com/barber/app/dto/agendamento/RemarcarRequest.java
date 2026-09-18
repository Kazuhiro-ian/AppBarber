package com.barber.app.dto.agendamento;

import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalTime;

public record RemarcarRequest(
        @NotNull(message = "Informe a nova data")
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate data,

        @NotNull(message = "Informe o novo horário")
        @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
        LocalTime horario,

        /** Opcional: permite trocar de barbeiro ao remarcar. */
        Long barbeiroId) {
}
