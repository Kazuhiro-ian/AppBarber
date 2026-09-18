package com.barber.app.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Barbeiro")
class BarbeiroTest {

    @Test
    @DisplayName("jornada precisa começar antes de terminar")
    void jornadaInvalida() {
        Barbeiro barbeiro = novo();

        assertThatThrownBy(() -> barbeiro.definirHorarioTrabalho(LocalTime.of(19, 0), LocalTime.of(9, 0)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("atendimento precisa caber inteiro dentro da jornada")
    void atendeNoHorario() {
        Barbeiro barbeiro = novo();
        barbeiro.definirHorarioTrabalho(LocalTime.of(9, 0), LocalTime.of(19, 0));

        assertThat(barbeiro.atendeNoHorario(LocalTime.of(9, 0), 30)).isTrue();
        assertThat(barbeiro.atendeNoHorario(LocalTime.of(18, 30), 30)).isTrue();
        assertThat(barbeiro.atendeNoHorario(LocalTime.of(18, 45), 30)).isFalse();
        assertThat(barbeiro.atendeNoHorario(LocalTime.of(8, 30), 30)).isFalse();
    }

    @Test
    @DisplayName("sem jornada configurada, qualquer horário é aceito")
    void semJornada() {
        assertThat(novo().atendeNoHorario(LocalTime.of(23, 0), 30)).isTrue();
    }

    @Test
    @DisplayName("comissão incide apenas sobre atendimentos concluídos")
    void comissaoSomenteDeConcluidos() {
        Barbeiro barbeiro = novo();
        barbeiro.setComissao(new BigDecimal("40.00"));

        Agendamento concluido = agendamento(barbeiro, "100.00", LocalTime.of(10, 0));
        concluido.concluir();
        Agendamento confirmado = agendamento(barbeiro, "100.00", LocalTime.of(11, 0));
        Agendamento cancelado = agendamento(barbeiro, "100.00", LocalTime.of(12, 0));
        cancelado.cancelar();

        BigDecimal comissao = barbeiro.calcularComissao(List.of(concluido, confirmado, cancelado));

        assertThat(comissao).isEqualByComparingTo("40.00");
    }

    @Test
    @DisplayName("sem percentual configurado a comissão é zero")
    void semComissao() {
        Barbeiro barbeiro = novo();
        barbeiro.setComissao(null);

        assertThat(barbeiro.calcularComissao(List.of())).isEqualByComparingTo("0");
    }

    private Barbeiro novo() {
        return new Barbeiro("Carlos", "carlos@email.com", "hash", "(11) 91111-1111");
    }

    private Agendamento agendamento(Barbeiro barbeiro, String preco, LocalTime horario) {
        Cliente cliente = new Cliente("Joao", "joao@email.com", "hash", null);
        Servico servico = new Servico("Corte", "Cabelo", 30, new BigDecimal(preco));
        return new Agendamento(cliente, barbeiro, servico, LocalDate.now().plusDays(1), horario);
    }
}
