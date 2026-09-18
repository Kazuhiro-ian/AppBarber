package com.barber.app.dto.agendamento;

import com.barber.app.domain.Agendamento;
import com.barber.app.domain.enums.StatusAgendamento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/** Agendamento achatado para a tela: já traz nomes de cliente, barbeiro e serviço. */
public record AgendamentoResponse(
        Long id,
        Long clienteId,
        String clienteNome,
        String clienteTelefone,
        Long barbeiroId,
        String barbeiroNome,
        Long servicoId,
        String servicoNome,
        int duracaoMinutos,
        BigDecimal valor,
        LocalDate data,
        LocalTime horario,
        LocalTime horarioFim,
        StatusAgendamento status,
        LocalDateTime dataCriacao) {

    public static AgendamentoResponse de(Agendamento a) {
        return new AgendamentoResponse(
                a.getId(),
                a.getCliente().getId(),
                a.getCliente().getNome(),
                a.getCliente().getTelefone(),
                a.getBarbeiro().getId(),
                a.getBarbeiro().getNome(),
                a.getServico().getId(),
                a.getServico().getNome(),
                a.getServico().getDuracaoMinutos(),
                a.calcularValorTotal(),
                a.getData(),
                a.getHorario(),
                a.horarioFim(),
                a.getStatus(),
                a.getDataCriacao());
    }
}
