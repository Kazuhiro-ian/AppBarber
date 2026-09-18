package com.barber.app.service;

import com.barber.app.domain.Agendamento;
import com.barber.app.domain.Barbeiro;
import com.barber.app.domain.Cliente;
import com.barber.app.domain.Servico;
import com.barber.app.domain.Usuario;
import com.barber.app.domain.enums.StatusAgendamento;
import com.barber.app.domain.enums.TipoUsuario;
import com.barber.app.dto.agendamento.AgendamentoRequest;
import com.barber.app.dto.agendamento.AgendamentoResponse;
import com.barber.app.dto.agendamento.DisponibilidadeResponse;
import com.barber.app.dto.agendamento.RemarcarRequest;
import com.barber.app.exception.RecursoNaoEncontradoException;
import com.barber.app.exception.RegraNegocioException;
import com.barber.app.repository.AgendamentoRepository;
import com.barber.app.repository.BarbeiroRepository;
import com.barber.app.repository.ClienteRepository;
import com.barber.app.repository.ServicoRepository;
import com.barber.app.security.UsuarioLogado;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Regras de agendamento: disponibilidade, criação, remarcação, cancelamento
 * e conclusão do atendimento.
 *
 * <p>A grade de horários é montada em passos de {@value #INTERVALO_GRADE_MINUTOS}
 * minutos dentro da jornada do barbeiro, descartando os intervalos que colidem
 * com atendimentos já confirmados.</p>
 */
@Service
public class AgendamentoService {

    /** Passo da grade de horários oferecida ao cliente. */
    public static final int INTERVALO_GRADE_MINUTOS = 15;

    /** Jornada assumida quando o barbeiro ainda não configurou a dele. */
    private static final LocalTime INICIO_PADRAO = LocalTime.of(9, 0);
    private static final LocalTime FIM_PADRAO = LocalTime.of(19, 0);

    private final AgendamentoRepository agendamentoRepository;
    private final ClienteRepository clienteRepository;
    private final BarbeiroRepository barbeiroRepository;
    private final ServicoRepository servicoRepository;

    public AgendamentoService(AgendamentoRepository agendamentoRepository,
                              ClienteRepository clienteRepository,
                              BarbeiroRepository barbeiroRepository,
                              ServicoRepository servicoRepository) {
        this.agendamentoRepository = agendamentoRepository;
        this.clienteRepository = clienteRepository;
        this.barbeiroRepository = barbeiroRepository;
        this.servicoRepository = servicoRepository;
    }

    // ------------------------------------------------------------------
    // Consultas
    // ------------------------------------------------------------------

    /** Histórico completo do cliente autenticado (ou de outro cliente, se ADMIN). */
    @Transactional(readOnly = true)
    public List<AgendamentoResponse> historicoDoCliente(Long clienteId) {
        Long alvo = resolverClienteConsultado(clienteId);
        return agendamentoRepository.findByClienteIdOrderByDataDescHorarioDesc(alvo)
                .stream().map(AgendamentoResponse::de).toList();
    }

    /** Próximos atendimentos confirmados do cliente autenticado. */
    @Transactional(readOnly = true)
    public List<AgendamentoResponse> proximosDoCliente(Long clienteId) {
        Long alvo = resolverClienteConsultado(clienteId);
        return agendamentoRepository
                .findProximosDoCliente(alvo, LocalDate.now(), LocalTime.now().withSecond(0).withNano(0))
                .stream().map(AgendamentoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public List<AgendamentoResponse> agendaDoBarbeiro(Long barbeiroId, LocalDate data) {
        LocalDate dia = data != null ? data : LocalDate.now();
        return agendamentoRepository.findByBarbeiroIdAndDataOrderByHorarioAsc(barbeiroId, dia)
                .stream().map(AgendamentoResponse::de).toList();
    }

    /** Agenda geral do dia — visão do ADMIN. */
    @Transactional(readOnly = true)
    public List<AgendamentoResponse> agendaDoDia(LocalDate data) {
        LocalDate dia = data != null ? data : LocalDate.now();
        return agendamentoRepository.findByDataOrderByHorarioAsc(dia)
                .stream().map(AgendamentoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public AgendamentoResponse buscarPorId(Long id) {
        Agendamento agendamento = carregar(id);
        exigirAcessoDeLeitura(agendamento);
        return AgendamentoResponse.de(agendamento);
    }

    /**
     * Horários livres do barbeiro em um dia, considerando a duração do serviço.
     * Datas passadas devolvem grade vazia; no dia corrente, horários já vencidos
     * são descartados.
     */
    @Transactional(readOnly = true)
    public DisponibilidadeResponse consultarDisponibilidade(Long barbeiroId, LocalDate data, Long servicoId) {
        Barbeiro barbeiro = carregarBarbeiro(barbeiroId);
        Servico servico = carregarServico(servicoId);
        LocalDate dia = data != null ? data : LocalDate.now();

        List<Agendamento> ocupados = agendamentoRepository
                .findByBarbeiroIdAndDataAndStatus(barbeiroId, dia, StatusAgendamento.CONFIRMADO);

        List<LocalTime> horariosOcupados = ocupados.stream()
                .map(Agendamento::getHorario)
                .sorted()
                .toList();

        List<LocalTime> disponiveis = new ArrayList<>();
        if (!dia.isBefore(LocalDate.now()) && barbeiro.isAtivo()) {
            LocalTime inicio = barbeiro.getHorarioInicio() != null ? barbeiro.getHorarioInicio() : INICIO_PADRAO;
            LocalTime fim = barbeiro.getHorarioFim() != null ? barbeiro.getHorarioFim() : FIM_PADRAO;
            LocalDateTime agora = LocalDateTime.now();

            for (LocalTime slot = inicio;
                 !slot.plusMinutes(servico.getDuracaoMinutos()).isAfter(fim);
                 slot = slot.plusMinutes(INTERVALO_GRADE_MINUTOS)) {

                if (!LocalDateTime.of(dia, slot).isBefore(agora)
                        && !colide(slot, servico.getDuracaoMinutos(), ocupados, null)) {
                    disponiveis.add(slot);
                }
                // Protege contra a virada de dia (jornada terminando perto de 23:59).
                if (slot.plusMinutes(INTERVALO_GRADE_MINUTOS).isBefore(slot)) {
                    break;
                }
            }
        }

        return new DisponibilidadeResponse(
                barbeiro.getId(),
                barbeiro.getNome(),
                dia,
                servico.getId(),
                servico.getDuracaoMinutos(),
                disponiveis,
                horariosOcupados);
    }

    // ------------------------------------------------------------------
    // Comandos
    // ------------------------------------------------------------------

    @Transactional
    public AgendamentoResponse agendar(AgendamentoRequest request) {
        Cliente cliente = resolverClienteDoAgendamento(request.clienteId());
        Barbeiro barbeiro = carregarBarbeiro(request.barbeiroId());
        Servico servico = carregarServico(request.servicoId());

        if (!barbeiro.isAtivo()) {
            throw new RegraNegocioException(
                    "O barbeiro %s não está atendendo no momento".formatted(barbeiro.getNome()));
        }
        if (!servico.isAtivo()) {
            throw new RegraNegocioException(
                    "O serviço %s não está disponível".formatted(servico.getNome()));
        }

        validarHorario(barbeiro, servico, request.data(), request.horario(), null);
        validarAgendaDoCliente(cliente.getId(), servico, request.data(), request.horario(), null);

        Agendamento agendamento =
                new Agendamento(cliente, barbeiro, servico, request.data(), request.horario());
        return AgendamentoResponse.de(salvar(agendamento));
    }

    @Transactional
    public AgendamentoResponse remarcar(Long id, RemarcarRequest request) {
        Agendamento agendamento = carregar(id);
        exigirCliente(agendamento);

        Barbeiro barbeiro = request.barbeiroId() != null
                && !request.barbeiroId().equals(agendamento.getBarbeiro().getId())
                ? carregarBarbeiro(request.barbeiroId())
                : agendamento.getBarbeiro();

        validarHorario(barbeiro, agendamento.getServico(), request.data(), request.horario(), agendamento.getId());
        validarAgendaDoCliente(agendamento.getCliente().getId(), agendamento.getServico(),
                request.data(), request.horario(), agendamento.getId());

        agendamento.setBarbeiro(barbeiro);
        agendamento.remarcar(request.data(), request.horario());
        return AgendamentoResponse.de(salvar(agendamento));
    }

    /** Cancelamento pelo cliente, pelo barbeiro do atendimento ou pelo ADMIN. */
    @Transactional
    public AgendamentoResponse cancelar(Long id) {
        Agendamento agendamento = carregar(id);
        exigirClienteOuBarbeiro(agendamento);
        agendamento.cancelar();
        return AgendamentoResponse.de(agendamentoRepository.save(agendamento));
    }

    /** Conclusão do atendimento — apenas o barbeiro responsável ou o ADMIN. */
    @Transactional
    public AgendamentoResponse concluir(Long id) {
        Agendamento agendamento = carregar(id);
        exigirBarbeiro(agendamento);
        agendamento.concluir();
        return AgendamentoResponse.de(agendamentoRepository.save(agendamento));
    }

    // ------------------------------------------------------------------
    // Validações
    // ------------------------------------------------------------------

    /** Data/hora no futuro, dentro da jornada do barbeiro e sem colisão. */
    private void validarHorario(Barbeiro barbeiro, Servico servico, LocalDate data, LocalTime horario,
                                Long idIgnorado) {
        if (LocalDateTime.of(data, horario).isBefore(LocalDateTime.now())) {
            throw new RegraNegocioException("Não é possível agendar em uma data/hora no passado");
        }
        if (!barbeiro.atendeNoHorario(horario, servico.getDuracaoMinutos())) {
            throw new RegraNegocioException(
                    "O horário está fora da jornada de %s (%s às %s)".formatted(
                            barbeiro.getNome(), barbeiro.getHorarioInicio(), barbeiro.getHorarioFim()));
        }

        List<Agendamento> ocupados = agendamentoRepository
                .findByBarbeiroIdAndDataAndStatus(barbeiro.getId(), data, StatusAgendamento.CONFIRMADO);
        if (colide(horario, servico.getDuracaoMinutos(), ocupados, idIgnorado)) {
            throw new RegraNegocioException(
                    "%s já tem atendimento marcado nesse horário".formatted(barbeiro.getNome()));
        }
    }

    /** O cliente não pode ter dois atendimentos sobrepostos, nem com barbeiros diferentes. */
    private void validarAgendaDoCliente(Long clienteId, Servico servico, LocalDate data, LocalTime horario,
                                        Long idIgnorado) {
        List<Agendamento> doCliente = agendamentoRepository
                .findByClienteIdAndStatusOrderByDataAscHorarioAsc(clienteId, StatusAgendamento.CONFIRMADO)
                .stream()
                .filter(a -> a.getData().equals(data))
                .toList();
        if (colide(horario, servico.getDuracaoMinutos(), doCliente, idIgnorado)) {
            throw new RegraNegocioException("Você já tem um agendamento nesse horário");
        }
    }

    /** O intervalo [horario, horario + duracao) sobrepõe algum dos agendamentos? */
    private boolean colide(LocalTime horario, int duracaoMinutos, List<Agendamento> existentes, Long idIgnorado) {
        LocalTime fim = horario.plusMinutes(duracaoMinutos);
        return existentes.stream()
                .filter(a -> idIgnorado == null || !idIgnorado.equals(a.getId()))
                .anyMatch(a -> horario.isBefore(a.horarioFim()) && a.getHorario().isBefore(fim));
    }

    private Agendamento salvar(Agendamento agendamento) {
        try {
            return agendamentoRepository.saveAndFlush(agendamento);
        } catch (DataIntegrityViolationException ex) {
            // Barreira do índice único: duas reservas simultâneas no mesmo horário.
            throw new RegraNegocioException("Esse horário acabou de ser reservado. Escolha outro.");
        }
    }

    // ------------------------------------------------------------------
    // Autorização
    // ------------------------------------------------------------------

    /** O cliente do agendamento é sempre o usuário logado; ADMIN pode agendar por terceiros. */
    private Cliente resolverClienteDoAgendamento(Long clienteIdInformado) {
        Usuario logado = UsuarioLogado.obrigatorio();
        if (logado.isAdmin()) {
            if (clienteIdInformado == null) {
                throw new RegraNegocioException("Informe o cliente do agendamento");
            }
            return clienteRepository.findById(clienteIdInformado)
                    .orElseThrow(() -> RecursoNaoEncontradoException.de("Cliente", clienteIdInformado));
        }
        if (logado.getTipoUsuario() != TipoUsuario.CLIENTE) {
            throw new AccessDeniedException("Apenas clientes podem criar os próprios agendamentos");
        }
        return clienteRepository.findById(logado.getId())
                .orElseThrow(() -> RecursoNaoEncontradoException.de("Cliente", logado.getId()));
    }

    private Long resolverClienteConsultado(Long clienteIdInformado) {
        Usuario logado = UsuarioLogado.obrigatorio();
        if (clienteIdInformado == null || clienteIdInformado.equals(logado.getId())) {
            return logado.getId();
        }
        if (!logado.isAdmin()) {
            throw new AccessDeniedException("Você só pode consultar os seus próprios agendamentos");
        }
        return clienteIdInformado;
    }

    private void exigirAcessoDeLeitura(Agendamento agendamento) {
        Usuario logado = UsuarioLogado.obrigatorio();
        boolean permitido = logado.isAdmin()
                || agendamento.getCliente().getId().equals(logado.getId())
                || agendamento.getBarbeiro().getId().equals(logado.getId());
        if (!permitido) {
            throw new AccessDeniedException("Agendamento de outro usuário");
        }
    }

    private void exigirCliente(Agendamento agendamento) {
        Usuario logado = UsuarioLogado.obrigatorio();
        if (!logado.isAdmin() && !agendamento.getCliente().getId().equals(logado.getId())) {
            throw new AccessDeniedException("Somente o cliente do agendamento pode remarcá-lo");
        }
    }

    private void exigirClienteOuBarbeiro(Agendamento agendamento) {
        Usuario logado = UsuarioLogado.obrigatorio();
        boolean permitido = logado.isAdmin()
                || agendamento.getCliente().getId().equals(logado.getId())
                || agendamento.getBarbeiro().getId().equals(logado.getId());
        if (!permitido) {
            throw new AccessDeniedException("Você não pode alterar este agendamento");
        }
    }

    private void exigirBarbeiro(Agendamento agendamento) {
        Usuario logado = UsuarioLogado.obrigatorio();
        if (!logado.isAdmin() && !agendamento.getBarbeiro().getId().equals(logado.getId())) {
            throw new AccessDeniedException("Somente o barbeiro responsável pode concluir o atendimento");
        }
    }

    // ------------------------------------------------------------------

    private Agendamento carregar(Long id) {
        return agendamentoRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.de("Agendamento", id));
    }

    private Barbeiro carregarBarbeiro(Long id) {
        return barbeiroRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.de("Barbeiro", id));
    }

    private Servico carregarServico(Long id) {
        return servicoRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.de("Serviço", id));
    }
}
