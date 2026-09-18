package com.barber.app.domain;

import com.barber.app.domain.enums.StatusAgendamento;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "agendamento")
@Getter
@Setter
@NoArgsConstructor
public class Agendamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "barbeiro_id", nullable = false)
    private Barbeiro barbeiro;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "servico_id", nullable = false)
    private Servico servico;

    @Column(nullable = false)
    private LocalDate data;

    @Column(nullable = false)
    private LocalTime horario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusAgendamento status = StatusAgendamento.CONFIRMADO;

    @Column(name = "data_criacao", nullable = false)
    private LocalDateTime dataCriacao;

    public Agendamento(Cliente cliente, Barbeiro barbeiro, Servico servico, LocalDate data, LocalTime horario) {
        this.cliente = cliente;
        this.barbeiro = barbeiro;
        this.servico = servico;
        this.data = data;
        this.horario = horario;
        this.status = StatusAgendamento.CONFIRMADO;
    }

    @PrePersist
    void aoCriar() {
        if (dataCriacao == null) {
            dataCriacao = LocalDateTime.now();
        }
        if (status == null) {
            status = StatusAgendamento.CONFIRMADO;
        }
    }

    public void confirmar() {
        exigirStatus(StatusAgendamento.CONFIRMADO, "confirmar");
        this.status = StatusAgendamento.CONFIRMADO;
    }

    public void cancelar() {
        exigirStatus(StatusAgendamento.CONFIRMADO, "cancelar");
        this.status = StatusAgendamento.CANCELADO;
    }

    public void concluir() {
        exigirStatus(StatusAgendamento.CONFIRMADO, "concluir");
        this.status = StatusAgendamento.CONCLUIDO;
    }

    public void remarcar(LocalDate novaData, LocalTime novoHorario) {
        exigirStatus(StatusAgendamento.CONFIRMADO, "remarcar");
        this.data = novaData;
        this.horario = novoHorario;
    }

    /** Horário de término previsto, com base na duração do serviço. */
    public LocalTime horarioFim() {
        return horario.plusMinutes(servico.getDuracaoMinutos());
    }

    /** Há sobreposição de horário com outro agendamento do mesmo barbeiro? */
    public boolean conflitaCom(Agendamento outro) {
        if (!data.equals(outro.getData())) {
            return false;
        }
        return horario.isBefore(outro.horarioFim()) && outro.getHorario().isBefore(horarioFim());
    }

    public BigDecimal calcularValorTotal() {
        return servico != null && servico.getPreco() != null ? servico.getPreco() : BigDecimal.ZERO;
    }

    private void exigirStatus(StatusAgendamento esperado, String acao) {
        if (this.status != esperado) {
            throw new IllegalStateException(
                    "Não é possível %s um agendamento com status %s".formatted(acao, this.status));
        }
    }
}
