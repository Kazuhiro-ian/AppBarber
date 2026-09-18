package com.barber.app.service;

import com.barber.app.domain.Assinatura;
import com.barber.app.domain.Cliente;
import com.barber.app.domain.Usuario;
import com.barber.app.domain.enums.StatusAssinatura;
import com.barber.app.domain.enums.TipoUsuario;
import com.barber.app.dto.assinatura.AssinaturaResponse;
import com.barber.app.dto.assinatura.PlanoRequest;
import com.barber.app.dto.assinatura.PlanoResponse;
import com.barber.app.exception.RecursoNaoEncontradoException;
import com.barber.app.exception.RegraNegocioException;
import com.barber.app.repository.AssinaturaRepository;
import com.barber.app.repository.ClienteRepository;
import com.barber.app.security.UsuarioLogado;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Catálogo de planos (mantido pelo ADMIN) e assinaturas dos clientes.
 *
 * <p>Contratar um plano cria uma <em>cópia</em> dele para o cliente, com
 * vigência própria — assim cancelar ou renovar nunca altera o catálogo.</p>
 */
@Service
public class AssinaturaService {

    private final AssinaturaRepository assinaturaRepository;
    private final ClienteRepository clienteRepository;

    public AssinaturaService(AssinaturaRepository assinaturaRepository,
                             ClienteRepository clienteRepository) {
        this.assinaturaRepository = assinaturaRepository;
        this.clienteRepository = clienteRepository;
    }

    // ------------------------------------------------------------------
    // Catálogo de planos
    // ------------------------------------------------------------------

    /** Planos disponíveis para contratação (tela Serviços e Assinaturas). */
    @Transactional(readOnly = true)
    public List<PlanoResponse> listarPlanos() {
        return assinaturaRepository.findByModeloTrueAndAtivoTrueOrderByPrecoAsc()
                .stream().map(PlanoResponse::de).toList();
    }

    /** Catálogo completo com contagem de assinantes — visão do ADMIN. */
    @Transactional(readOnly = true)
    public List<PlanoResponse> listarPlanosAdmin() {
        return assinaturaRepository.findByModeloTrueOrderByPrecoAsc().stream()
                .map(plano -> PlanoResponse.de(
                        plano,
                        assinaturaRepository.countByPlanoIdAndStatus(plano.getId(), StatusAssinatura.ATIVA)))
                .toList();
    }

    @Transactional(readOnly = true)
    public PlanoResponse buscarPlano(Long id) {
        return PlanoResponse.de(carregarPlano(id));
    }

    @Transactional
    public PlanoResponse criarPlano(PlanoRequest request) {
        if (assinaturaRepository.existsByNomeIgnoreCaseAndModeloTrue(request.nome().trim())) {
            throw new RegraNegocioException("Já existe um plano chamado " + request.nome());
        }
        Assinatura plano = Assinatura.novoPlano(
                request.nome().trim(),
                limpar(request.beneficios()),
                request.preco(),
                request.periodicidade());
        if (request.ativo() != null) {
            plano.setAtivo(request.ativo());
        }
        return PlanoResponse.de(assinaturaRepository.save(plano));
    }

    @Transactional
    public PlanoResponse editarPlano(Long id, PlanoRequest request) {
        Assinatura plano = carregarPlano(id);
        plano.editarPlano(
                request.nome().trim(),
                limpar(request.beneficios()),
                request.preco(),
                request.periodicidade(),
                request.ativo() == null || request.ativo());
        return PlanoResponse.de(assinaturaRepository.save(plano));
    }

    /**
     * Retira o plano do catálogo. Se já houver assinantes, ele é apenas
     * desativado, para não quebrar as assinaturas em andamento.
     */
    @Transactional
    public void removerPlano(Long id) {
        Assinatura plano = carregarPlano(id);
        long vinculadas = assinaturaRepository.countByPlanoIdAndStatus(plano.getId(), StatusAssinatura.ATIVA);
        if (vinculadas > 0) {
            plano.setAtivo(false);
            assinaturaRepository.save(plano);
            return;
        }
        assinaturaRepository.delete(plano);
    }

    // ------------------------------------------------------------------
    // Assinatura do cliente
    // ------------------------------------------------------------------

    /** Assinatura vigente do cliente autenticado, ou {@code null} se não houver. */
    @Transactional(readOnly = true)
    public AssinaturaResponse minhaAssinatura() {
        Cliente cliente = clienteLogado();
        Assinatura assinatura = cliente.getAssinaturaAtiva();
        return assinatura != null ? AssinaturaResponse.de(assinatura) : null;
    }

    @Transactional
    public AssinaturaResponse assinar(Long planoId) {
        Cliente cliente = clienteLogado();
        if (cliente.possuiAssinaturaVigente()) {
            throw new RegraNegocioException(
                    "Você já tem a assinatura %s ativa. Cancele antes de contratar outra."
                            .formatted(cliente.getAssinaturaAtiva().getNome()));
        }

        Assinatura contratada = carregarPlano(planoId).contratar();
        assinaturaRepository.save(contratada);
        cliente.setAssinaturaAtiva(contratada);
        clienteRepository.save(cliente);
        return AssinaturaResponse.de(contratada);
    }

    @Transactional
    public AssinaturaResponse cancelarAssinatura() {
        Cliente cliente = clienteLogado();
        Assinatura assinatura = cliente.getAssinaturaAtiva();
        if (assinatura == null || assinatura.getStatus() == StatusAssinatura.CANCELADA) {
            throw new RegraNegocioException("Você não tem uma assinatura ativa para cancelar");
        }
        cliente.cancelarAssinatura();
        assinaturaRepository.save(assinatura);
        clienteRepository.save(cliente);
        return AssinaturaResponse.de(assinatura);
    }

    /** Renova por mais um período a assinatura do cliente autenticado. */
    @Transactional
    public AssinaturaResponse renovarAssinatura() {
        Cliente cliente = clienteLogado();
        Assinatura assinatura = cliente.getAssinaturaAtiva();
        if (assinatura == null) {
            throw new RegraNegocioException("Você não tem uma assinatura para renovar");
        }
        assinatura.renovar();
        return AssinaturaResponse.de(assinaturaRepository.save(assinatura));
    }

    // ------------------------------------------------------------------

    private Cliente clienteLogado() {
        Usuario logado = UsuarioLogado.obrigatorio();
        if (logado.getTipoUsuario() != TipoUsuario.CLIENTE) {
            throw new AccessDeniedException("Apenas clientes possuem assinatura");
        }
        return clienteRepository.findById(logado.getId())
                .orElseThrow(() -> RecursoNaoEncontradoException.de("Cliente", logado.getId()));
    }

    private Assinatura carregarPlano(Long id) {
        return assinaturaRepository.findByIdAndModeloTrue(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.de("Plano", id));
    }

    private List<String> limpar(List<String> beneficios) {
        if (beneficios == null) {
            return new ArrayList<>();
        }
        return beneficios.stream()
                .filter(b -> b != null && !b.isBlank())
                .map(String::trim)
                .distinct()
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
    }
}
