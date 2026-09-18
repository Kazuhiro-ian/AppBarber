package com.barber.app.service;

import com.barber.app.domain.Barbeiro;
import com.barber.app.domain.Cliente;
import com.barber.app.domain.Servico;
import com.barber.app.dto.agendamento.AgendamentoRequest;
import com.barber.app.dto.agendamento.AgendamentoResponse;
import com.barber.app.exception.RegraNegocioException;
import com.barber.app.repository.BarbeiroRepository;
import com.barber.app.repository.ClienteRepository;
import com.barber.app.repository.ServicoRepository;
import com.barber.app.security.UsuarioAutenticado;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Regras de agendamento contra o banco em memória, com um cliente autenticado. */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("AgendamentoService")
class AgendamentoServiceTest {

    private static final LocalDate AMANHA = LocalDate.now().plusDays(1);

    @Autowired
    private AgendamentoService agendamentoService;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private BarbeiroRepository barbeiroRepository;

    @Autowired
    private ServicoRepository servicoRepository;

    private Cliente cliente;
    private Barbeiro barbeiro;
    private Servico servico;

    @BeforeEach
    void preparar() {
        String sufixo = String.valueOf(System.nanoTime());

        cliente = clienteRepository.save(
                new Cliente("Cliente Teste", "cliente" + sufixo + "@email.com", "hash", null));

        Barbeiro novoBarbeiro = new Barbeiro("Barbeiro Teste", "barbeiro" + sufixo + "@email.com", "hash", null);
        novoBarbeiro.definirHorarioTrabalho(LocalTime.of(9, 0), LocalTime.of(18, 0));
        novoBarbeiro.setEspecialidades(List.of("Corte"));
        novoBarbeiro.setComissao(new BigDecimal("40.00"));
        barbeiro = barbeiroRepository.save(novoBarbeiro);

        servico = servicoRepository.save(new Servico("Corte", "Cabelo", 30, new BigDecimal("45.00")));

        autenticar(cliente);
    }

    @Test
    @DisplayName("agenda e devolve o horário de término calculado")
    void agenda() {
        AgendamentoResponse resposta = agendar(LocalTime.of(10, 0));

        assertThat(resposta.id()).isNotNull();
        assertThat(resposta.horarioFim()).isEqualTo(LocalTime.of(10, 30));
        assertThat(resposta.valor()).isEqualByComparingTo("45.00");
    }

    @Test
    @DisplayName("recusa horário já ocupado pelo mesmo barbeiro")
    void recusaHorarioOcupado() {
        agendar(LocalTime.of(10, 0));

        assertThatThrownBy(() -> agendar(LocalTime.of(10, 15)))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("já tem atendimento");
    }

    @Test
    @DisplayName("recusa horário fora da jornada do barbeiro")
    void recusaForaDaJornada() {
        assertThatThrownBy(() -> agendar(LocalTime.of(18, 0)))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("fora da jornada");
    }

    @Test
    @DisplayName("recusa data no passado")
    void recusaPassado() {
        AgendamentoRequest pedido = new AgendamentoRequest(
                barbeiro.getId(), servico.getId(), LocalDate.now().minusDays(1), LocalTime.of(10, 0), null);

        assertThatThrownBy(() -> agendamentoService.agendar(pedido))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("passado");
    }

    @Test
    @DisplayName("a grade de disponibilidade não oferece horários já reservados")
    void disponibilidadeDescartaOcupados() {
        agendar(LocalTime.of(10, 0));

        var grade = agendamentoService.consultarDisponibilidade(barbeiro.getId(), AMANHA, servico.getId());

        assertThat(grade.horariosOcupados()).contains(LocalTime.of(10, 0));
        assertThat(grade.horariosDisponiveis())
                .doesNotContain(LocalTime.of(9, 45), LocalTime.of(10, 0), LocalTime.of(10, 15));
        assertThat(grade.horariosDisponiveis()).contains(LocalTime.of(9, 30), LocalTime.of(10, 30));
    }

    @Test
    @DisplayName("último horário da grade termina junto com a jornada")
    void gradeRespeitaFimDaJornada() {
        var grade = agendamentoService.consultarDisponibilidade(barbeiro.getId(), AMANHA, servico.getId());

        assertThat(grade.horariosDisponiveis()).endsWith(LocalTime.of(17, 30));
    }

    @Test
    @DisplayName("cancelar libera o horário para outro agendamento")
    void cancelarLiberaHorario() {
        AgendamentoResponse agendado = agendar(LocalTime.of(11, 0));

        agendamentoService.cancelar(agendado.id());

        assertThat(agendar(LocalTime.of(11, 0)).id()).isNotNull();
    }

    private AgendamentoResponse agendar(LocalTime horario) {
        return agendamentoService.agendar(
                new AgendamentoRequest(barbeiro.getId(), servico.getId(), AMANHA, horario, null));
    }

    private void autenticar(Cliente usuario) {
        var principal = new UsuarioAutenticado(usuario);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }
}
