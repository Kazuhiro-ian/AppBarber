package com.barber.app.service;

import com.barber.app.domain.Agendamento;
import com.barber.app.domain.Cliente;
import com.barber.app.domain.Usuario;
import com.barber.app.domain.enums.StatusAgendamento;
import com.barber.app.domain.enums.TipoUsuario;
import com.barber.app.dto.agendamento.AgendamentoResponse;
import com.barber.app.dto.assinatura.AssinaturaResponse;
import com.barber.app.dto.cliente.ClienteResponse;
import com.barber.app.dto.cliente.HomeClienteResponse;
import com.barber.app.exception.RecursoNaoEncontradoException;
import com.barber.app.repository.AgendamentoRepository;
import com.barber.app.repository.ClienteRepository;
import com.barber.app.security.UsuarioLogado;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/** Dados do cliente: home consolidada e listagem para o ADMIN. */
@Service
public class ClienteService {

    /** Quantos próximos agendamentos a home exibe. */
    private static final int LIMITE_PROXIMOS = 5;

    private final ClienteRepository clienteRepository;
    private final AgendamentoRepository agendamentoRepository;

    public ClienteService(ClienteRepository clienteRepository,
                          AgendamentoRepository agendamentoRepository) {
        this.clienteRepository = clienteRepository;
        this.agendamentoRepository = agendamentoRepository;
    }

    /** Tudo que a Home do Cliente precisa em uma única chamada. */
    @Transactional(readOnly = true)
    public HomeClienteResponse home() {
        Cliente cliente = clienteLogado();

        List<AgendamentoResponse> proximos = agendamentoRepository
                .findProximosDoCliente(cliente.getId(), LocalDate.now(), LocalTime.now().withSecond(0).withNano(0))
                .stream()
                .limit(LIMITE_PROXIMOS)
                .map(AgendamentoResponse::de)
                .toList();

        List<Agendamento> historico =
                agendamentoRepository.findByClienteIdOrderByDataDescHorarioDesc(cliente.getId());
        List<Agendamento> concluidos = historico.stream()
                .filter(a -> a.getStatus() == StatusAgendamento.CONCLUIDO)
                .toList();
        BigDecimal totalGasto = concluidos.stream()
                .map(Agendamento::calcularValorTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new HomeClienteResponse(
                cliente.getNome(),
                cliente.getFotoPerfil(),
                proximos.isEmpty() ? null : proximos.getFirst(),
                proximos,
                concluidos.size(),
                totalGasto,
                cliente.getAssinaturaAtiva() != null
                        ? AssinaturaResponse.de(cliente.getAssinaturaAtiva())
                        : null);
    }

    @Transactional(readOnly = true)
    public List<ClienteResponse> listar(String nome) {
        List<Cliente> clientes = nome != null && !nome.isBlank()
                ? clienteRepository.findByNomeContainingIgnoreCaseOrderByNomeAsc(nome.trim())
                : clienteRepository.findAllByOrderByNomeAsc();
        return clientes.stream().map(ClienteResponse::de).toList();
    }

    /** Clientes com assinatura vinculada — usado no painel administrativo. */
    @Transactional(readOnly = true)
    public List<ClienteResponse> listarAssinantes() {
        return clienteRepository.findByAssinaturaAtivaIsNotNullOrderByNomeAsc()
                .stream().map(ClienteResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public ClienteResponse buscarPorId(Long id) {
        return ClienteResponse.de(clienteRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.de("Cliente", id)));
    }

    private Cliente clienteLogado() {
        Usuario logado = UsuarioLogado.obrigatorio();
        if (logado.getTipoUsuario() != TipoUsuario.CLIENTE) {
            throw new AccessDeniedException("Esta área é exclusiva de clientes");
        }
        return clienteRepository.findById(logado.getId())
                .orElseThrow(() -> RecursoNaoEncontradoException.de("Cliente", logado.getId()));
    }
}
