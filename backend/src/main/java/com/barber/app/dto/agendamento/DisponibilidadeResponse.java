package com.barber.app.dto.agendamento;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Grade de horários de um barbeiro em um dia, para um serviço específico.
 *
 * @param horariosDisponiveis horários livres que comportam a duração do serviço
 * @param horariosOcupados    horários já tomados, exibidos desabilitados na tela
 */
public record DisponibilidadeResponse(
        Long barbeiroId,
        String barbeiroNome,
        LocalDate data,
        Long servicoId,
        int duracaoMinutos,
        List<LocalTime> horariosDisponiveis,
        List<LocalTime> horariosOcupados) {
}
