package com.barber.app.service;

import com.barber.app.domain.Agendamento;
import com.barber.app.domain.Barbeiro;
import com.barber.app.domain.Usuario;
import com.barber.app.domain.enums.StatusAgendamento;
import com.barber.app.dto.agendamento.AgendamentoResponse;
import com.barber.app.dto.barbeiro.AgendaDiaResponse;
import com.barber.app.dto.barbeiro.BarbeiroPerfilRequest;
import com.barber.app.dto.barbeiro.BarbeiroResponse;
import com.barber.app.dto.barbeiro.ComissaoResponse;
import com.barber.app.dto.barbeiro.NovoBarbeiroRequest;
import com.barber.app.dto.barbeiro.PainelBarbeiroResponse;
import com.barber.app.exception.RecursoNaoEncontradoException;
import com.barber.app.exception.RegraNegocioException;
import com.barber.app.repository.AgendamentoRepository;
import com.barber.app.repository.BarbeiroRepository;
import com.barber.app.repository.UsuarioRepository;
import com.barber.app.security.UsuarioLogado;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Perfil profissional do barbeiro, agenda do dia, painel e comissões.
 * O próprio barbeiro edita horários e especialidades; comissão e status
 * ativo/inativo são exclusivos do ADMIN.
 */
@Service
public class BarbeiroService {

    private final BarbeiroRepository barbeiroRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public BarbeiroService(BarbeiroRepository barbeiroRepository,
                           AgendamentoRepository agendamentoRepository,
                           UsuarioRepository usuarioRepository,
                           PasswordEncoder passwordEncoder) {
        this.barbeiroRepository = barbeiroRepository;
        this.agendamentoRepository = agendamentoRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ------------------------------------------------------------------
    // Consultas
    // ------------------------------------------------------------------

    /** Lista para a tela de agendamento do cliente: apenas barbeiros ativos. */
    @Transactional(readOnly = true)
    public List<BarbeiroResponse> listarDisponiveis() {
        return barbeiroRepository.findByAtivoTrueOrderByNomeAsc()
                .stream().map(BarbeiroResponse::publico).toList();
    }

    /** Lista completa para o ADMIN, incluindo inativos, comissão e contato. */
    @Transactional(readOnly = true)
    public List<BarbeiroResponse> listarTodos() {
        return barbeiroRepository.findAllByOrderByNomeAsc()
                .stream().map(BarbeiroResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public BarbeiroResponse buscarPorId(Long id) {
        Barbeiro barbeiro = carregar(id);
        return podeVerDadosCompletos(id) ? BarbeiroResponse.de(barbeiro) : BarbeiroResponse.publico(barbeiro);
    }

    /** Perfil do barbeiro autenticado. */
    @Transactional(readOnly = true)
    public BarbeiroResponse meuPerfil() {
        return BarbeiroResponse.de(carregar(idDoBarbeiroLogado()));
    }

    // ------------------------------------------------------------------
    // Agenda e painel
    // ------------------------------------------------------------------

    /** Agenda de um dia com os totalizadores exibidos no topo da tela. */
    @Transactional(readOnly = true)
    public AgendaDiaResponse agendaDoDia(Long barbeiroId, LocalDate data) {
        Long alvo = resolverBarbeiro(barbeiroId);
        Barbeiro barbeiro = carregar(alvo);
        LocalDate dia = data != null ? data : LocalDate.now();

        List<Agendamento> agenda = agendamentoRepository.findByBarbeiroIdAndDataOrderByHorarioAsc(alvo, dia);

        long confirmados = contar(agenda, StatusAgendamento.CONFIRMADO);
        long concluidos = contar(agenda, StatusAgendamento.CONCLUIDO);
        long cancelados = contar(agenda, StatusAgendamento.CANCELADO);

        BigDecimal previsto = somar(agenda, StatusAgendamento.CONFIRMADO)
                .add(somar(agenda, StatusAgendamento.CONCLUIDO));
        BigDecimal realizado = somar(agenda, StatusAgendamento.CONCLUIDO);

        return new AgendaDiaResponse(
                barbeiro.getId(),
                barbeiro.getNome(),
                dia,
                barbeiro.getHorarioInicio(),
                barbeiro.getHorarioFim(),
                confirmados,
                concluidos,
                cancelados,
                previsto,
                realizado,
                aplicarComissao(barbeiro, previsto),
                agenda.stream().map(AgendamentoResponse::de).toList());
    }

    /** Visão geral do dia + acumulado do mês para a tela inicial do barbeiro. */
    @Transactional(readOnly = true)
    public PainelBarbeiroResponse painel(Long barbeiroId, LocalDate data) {
        Long alvo = resolverBarbeiro(barbeiroId);
        Barbeiro barbeiro = carregar(alvo);
        LocalDate dia = data != null ? data : LocalDate.now();

        List<Agendamento> agenda = agendamentoRepository.findByBarbeiroIdAndDataOrderByHorarioAsc(alvo, dia);
        BigDecimal faturamentoDia = somar(agenda, StatusAgendamento.CONCLUIDO);

        LocalDate inicioMes = dia.withDayOfMonth(1);
        LocalDate fimMes = dia.withDayOfMonth(dia.lengthOfMonth());
        List<Agendamento> doMes = agendamentoRepository
                .findByBarbeiroIdAndDataBetweenAndStatusOrderByDataAscHorarioAsc(
                        alvo, inicioMes, fimMes, StatusAgendamento.CONCLUIDO);
        BigDecimal faturamentoMes = doMes.stream()
                .map(Agendamento::calcularValorTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDateTime agora = LocalDateTime.now();
        AgendamentoResponse proximo = agenda.stream()
                .filter(a -> a.getStatus() == StatusAgendamento.CONFIRMADO)
                .filter(a -> !LocalDateTime.of(a.getData(), a.getHorario()).isBefore(agora))
                .findFirst()
                .map(AgendamentoResponse::de)
                .orElse(null);

        return new PainelBarbeiroResponse(
                barbeiro.getId(),
                barbeiro.getNome(),
                dia,
                agenda.stream().filter(a -> a.getStatus() != StatusAgendamento.CANCELADO).count(),
                contar(agenda, StatusAgendamento.CONCLUIDO),
                contar(agenda, StatusAgendamento.CONFIRMADO),
                faturamentoDia,
                aplicarComissao(barbeiro, faturamentoDia),
                faturamentoMes,
                aplicarComissao(barbeiro, faturamentoMes),
                proximo,
                agenda.stream().map(AgendamentoResponse::de).toList());
    }

    /** Comissão do barbeiro no período, sobre os atendimentos concluídos. */
    @Transactional(readOnly = true)
    public ComissaoResponse calcularComissao(Long barbeiroId, LocalDate inicio, LocalDate fim) {
        Long alvo = resolverBarbeiro(barbeiroId);
        Barbeiro barbeiro = carregar(alvo);
        LocalDate de = inicio != null ? inicio : LocalDate.now().withDayOfMonth(1);
        LocalDate ate = fim != null ? fim : LocalDate.now();
        if (de.isAfter(ate)) {
            throw new RegraNegocioException("A data inicial não pode ser posterior à data final");
        }

        List<Agendamento> concluidos = agendamentoRepository
                .findByBarbeiroIdAndDataBetweenAndStatusOrderByDataAscHorarioAsc(
                        alvo, de, ate, StatusAgendamento.CONCLUIDO);

        BigDecimal faturamento = concluidos.stream()
                .map(Agendamento::calcularValorTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new ComissaoResponse(
                barbeiro.getId(),
                barbeiro.getNome(),
                de,
                ate,
                concluidos.size(),
                faturamento,
                barbeiro.getComissao(),
                barbeiro.calcularComissao(concluidos));
    }

    // ------------------------------------------------------------------
    // Comandos
    // ------------------------------------------------------------------

    /** Cadastro de barbeiro pelo ADMIN: cria o usuário e o perfil profissional. */
    @Transactional
    public BarbeiroResponse cadastrar(NovoBarbeiroRequest request) {
        String email = request.email().trim().toLowerCase();
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new RegraNegocioException("Já existe uma conta com o e-mail " + email);
        }

        Barbeiro barbeiro = new Barbeiro(
                request.nome().trim(),
                email,
                passwordEncoder.encode(request.senha()),
                request.telefone());
        barbeiro.definirHorarioTrabalho(request.horarioInicio(), request.horarioFim());
        barbeiro.setEspecialidades(normalizarEspecialidades(request.especialidades()));
        barbeiro.setComissao(request.comissao() != null ? request.comissao() : BigDecimal.ZERO);
        barbeiro.setAtivo(true);

        return BarbeiroResponse.de(barbeiroRepository.save(barbeiro));
    }

    /**
     * Atualiza o perfil profissional. O barbeiro só altera o próprio cadastro
     * e não mexe em comissão nem no status ativo — isso é papel do ADMIN.
     */
    @Transactional
    public BarbeiroResponse atualizarPerfil(Long barbeiroId, BarbeiroPerfilRequest request) {
        Long alvo = resolverBarbeiro(barbeiroId);
        Barbeiro barbeiro = carregar(alvo);
        boolean admin = UsuarioLogado.obrigatorio().isAdmin();

        if (request.especialidades() != null) {
            barbeiro.setEspecialidades(normalizarEspecialidades(request.especialidades()));
        }
        if (request.horarioInicio() != null || request.horarioFim() != null) {
            barbeiro.definirHorarioTrabalho(
                    request.horarioInicio() != null ? request.horarioInicio() : barbeiro.getHorarioInicio(),
                    request.horarioFim() != null ? request.horarioFim() : barbeiro.getHorarioFim());
        }
        if (request.comissao() != null) {
            exigirAdmin(admin, "alterar a comissão");
            barbeiro.setComissao(request.comissao());
        }
        if (request.ativo() != null) {
            exigirAdmin(admin, "ativar ou inativar um barbeiro");
            barbeiro.setAtivo(request.ativo());
        }

        return BarbeiroResponse.de(barbeiroRepository.save(barbeiro));
    }

    /** Inativa o barbeiro: some da lista de agendamento, mas o histórico é preservado. */
    @Transactional
    public BarbeiroResponse alterarStatus(Long id, boolean ativo) {
        Barbeiro barbeiro = carregar(id);
        barbeiro.setAtivo(ativo);
        return BarbeiroResponse.de(barbeiroRepository.save(barbeiro));
    }

    // ------------------------------------------------------------------
    // Apoio
    // ------------------------------------------------------------------

    /** Sem id informado, usa o barbeiro logado; um id diferente exige ADMIN. */
    private Long resolverBarbeiro(Long barbeiroIdInformado) {
        Usuario logado = UsuarioLogado.obrigatorio();
        if (barbeiroIdInformado == null) {
            return idDoBarbeiroLogado();
        }
        if (!logado.isAdmin() && !barbeiroIdInformado.equals(logado.getId())) {
            throw new AccessDeniedException("Você só pode acessar a sua própria agenda");
        }
        return barbeiroIdInformado;
    }

    private Long idDoBarbeiroLogado() {
        Usuario logado = UsuarioLogado.obrigatorio();
        if (!(barbeiroRepository.existsById(logado.getId()))) {
            throw new AccessDeniedException("O usuário autenticado não é um barbeiro");
        }
        return logado.getId();
    }

    private boolean podeVerDadosCompletos(Long barbeiroId) {
        return UsuarioLogado.atual()
                .map(u -> u.isAdmin() || barbeiroId.equals(u.getId()))
                .orElse(false);
    }

    private void exigirAdmin(boolean admin, String acao) {
        if (!admin) {
            throw new AccessDeniedException("Somente um administrador pode " + acao);
        }
    }

    private List<String> normalizarEspecialidades(List<String> especialidades) {
        if (especialidades == null) {
            return new ArrayList<>();
        }
        return especialidades.stream()
                .filter(e -> e != null && !e.isBlank())
                .map(String::trim)
                .distinct()
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
    }

    private long contar(List<Agendamento> agenda, StatusAgendamento status) {
        return agenda.stream().filter(a -> a.getStatus() == status).count();
    }

    private BigDecimal somar(List<Agendamento> agenda, StatusAgendamento status) {
        return agenda.stream()
                .filter(a -> a.getStatus() == status)
                .map(Agendamento::calcularValorTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal aplicarComissao(Barbeiro barbeiro, BigDecimal base) {
        if (barbeiro.getComissao() == null || base == null) {
            return BigDecimal.ZERO;
        }
        return base.multiply(barbeiro.getComissao())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private Barbeiro carregar(Long id) {
        return barbeiroRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.de("Barbeiro", id));
    }
}
