package com.barber.app.service;

import com.barber.app.domain.Servico;
import com.barber.app.dto.servico.ServicoRequest;
import com.barber.app.dto.servico.ServicoResponse;
import com.barber.app.exception.RecursoNaoEncontradoException;
import com.barber.app.exception.RegraNegocioException;
import com.barber.app.repository.ServicoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ServicoService {

    private final ServicoRepository servicoRepository;

    public ServicoService(ServicoRepository servicoRepository) {
        this.servicoRepository = servicoRepository;
    }

    @Transactional(readOnly = true)
    public List<ServicoResponse> listar(boolean apenasAtivos) {
        List<Servico> servicos = apenasAtivos
                ? servicoRepository.findByAtivoTrueOrderByNomeAsc()
                : servicoRepository.findAll();
        return servicos.stream().map(ServicoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public List<ServicoResponse> listarPorCategoria(String categoria) {
        return servicoRepository.findByCategoriaIgnoreCaseOrderByNomeAsc(categoria)
                .stream().map(ServicoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public ServicoResponse buscarPorId(Long id) {
        return ServicoResponse.de(carregar(id));
    }

    @Transactional
    public ServicoResponse cadastrar(ServicoRequest request) {
        if (servicoRepository.existsByNomeIgnoreCase(request.nome().trim())) {
            throw new RegraNegocioException("Já existe um serviço chamado '%s'".formatted(request.nome()));
        }
        Servico servico = new Servico(
                request.nome().trim(),
                request.categoria(),
                request.duracaoMinutos(),
                request.preco());
        if (request.ativo() != null) {
            servico.setAtivo(request.ativo());
        }
        return ServicoResponse.de(servicoRepository.save(servico));
    }

    @Transactional
    public ServicoResponse editar(Long id, ServicoRequest request) {
        Servico servico = carregar(id);
        servico.editar(
                request.nome().trim(),
                request.categoria(),
                request.duracaoMinutos(),
                request.preco(),
                request.ativo() == null || request.ativo());
        return ServicoResponse.de(servicoRepository.save(servico));
    }

    /** Inativa em vez de excluir, preservando o histórico de agendamentos. */
    @Transactional
    public void inativar(Long id) {
        Servico servico = carregar(id);
        servico.inativar();
        servicoRepository.save(servico);
    }

    @Transactional
    public ServicoResponse reativar(Long id) {
        Servico servico = carregar(id);
        servico.reativar();
        return ServicoResponse.de(servicoRepository.save(servico));
    }

    private Servico carregar(Long id) {
        return servicoRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.de("Serviço", id));
    }
}
