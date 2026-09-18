package com.barber.app.domain;

import com.barber.app.domain.enums.StatusAgendamento;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Agendamento")
class AgendamentoTest {

    private static final LocalDate AMANHA = LocalDate.now().plusDays(1);

    @Test
    @DisplayName("nasce confirmado e calcula o valor pelo preço do serviço")
    void nasceConfirmado() {
        Agendamento agendamento = novo(LocalTime.of(10, 0), 30, new BigDecimal("45.00"));

        assertThat(agendamento.getStatus()).isEqualTo(StatusAgendamento.CONFIRMADO);
        assertThat(agendamento.calcularValorTotal()).isEqualByComparingTo("45.00");
    }

    @Test
    @DisplayName("o horário de término considera a duração do serviço")
    void horarioFim() {
        Agendamento agendamento = novo(LocalTime.of(10, 0), 40, new BigDecimal("55.00"));

        assertThat(agendamento.horarioFim()).isEqualTo(LocalTime.of(10, 40));
    }

    @Test
    @DisplayName("detecta sobreposição parcial de horários no mesmo dia")
    void detectaConflito() {
        Agendamento dasDez = novo(LocalTime.of(10, 0), 30, new BigDecimal("45.00"));
        Agendamento dasDezEQuinze = novo(LocalTime.of(10, 15), 30, new BigDecimal("45.00"));

        assertThat(dasDez.conflitaCom(dasDezEQuinze)).isTrue();
    }

    @Test
    @DisplayName("horários encostados não conflitam")
    void naoConflitaQuandoEncostam() {
        Agendamento dasDez = novo(LocalTime.of(10, 0), 30, new BigDecimal("45.00"));
        Agendamento dasDezEMeia = novo(LocalTime.of(10, 30), 30, new BigDecimal("45.00"));

        assertThat(dasDez.conflitaCom(dasDezEMeia)).isFalse();
    }

    @Test
    @DisplayName("concluir e cancelar só valem para agendamentos confirmados")
    void transicoesDeStatus() {
        Agendamento agendamento = novo(LocalTime.of(10, 0), 30, new BigDecimal("45.00"));

        agendamento.concluir();
        assertThat(agendamento.getStatus()).isEqualTo(StatusAgendamento.CONCLUIDO);

        assertThatThrownBy(agendamento::cancelar)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("CONCLUIDO");
    }

    @Test
    @DisplayName("remarcar troca data e hora mantendo o status confirmado")
    void remarcar() {
        Agendamento agendamento = novo(LocalTime.of(10, 0), 30, new BigDecimal("45.00"));

        agendamento.remarcar(AMANHA.plusDays(1), LocalTime.of(16, 0));

        assertThat(agendamento.getData()).isEqualTo(AMANHA.plusDays(1));
        assertThat(agendamento.getHorario()).isEqualTo(LocalTime.of(16, 0));
        assertThat(agendamento.getStatus()).isEqualTo(StatusAgendamento.CONFIRMADO);
    }

    @Test
    @DisplayName("agendamento cancelado não pode ser concluído")
    void canceladoNaoConclui() {
        Agendamento agendamento = novo(LocalTime.of(10, 0), 30, new BigDecimal("45.00"));
        agendamento.cancelar();

        assertThatThrownBy(agendamento::concluir).isInstanceOf(IllegalStateException.class);
    }

    private Agendamento novo(LocalTime horario, int duracaoMinutos, BigDecimal preco) {
        Cliente cliente = new Cliente("Joao", "joao@email.com", "hash", "(11) 90000-0000");
        Barbeiro barbeiro = new Barbeiro("Carlos", "carlos@email.com", "hash", "(11) 91111-1111");
        Servico servico = new Servico("Corte", "Cabelo", duracaoMinutos, preco);
        return new Agendamento(cliente, barbeiro, servico, AMANHA, horario);
    }
}
