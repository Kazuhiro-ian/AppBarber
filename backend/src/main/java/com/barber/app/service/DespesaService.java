package com.barber.app.service;

import com.barber.app.domain.Barbeiro;
import com.barber.app.domain.Despesa;
import com.barber.app.dto.despesa.DespesaRequest;
import com.barber.app.dto.despesa.DespesaResponse;
import com.barber.app.exception.RecursoNaoEncontradoException;
import com.barber.app.exception.RegraNegocioException;
import com.barber.app.repository.BarbeiroRepository;
import com.barber.app.repository.DespesaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/** CRUD de despesas — a base de gastos da Gestão Financeira. */
@Service
public class DespesaService {

    private final DespesaRepository despesaRepository;
    private final BarbeiroRepository barbeiroRepository;

    public DespesaService(DespesaRepository despesaRepository, BarbeiroRepository barbeiroRepository) {
        this.despesaRepository = despesaRepository;
        this.barbeiroRepository = barbeiroRepository;
    }

    @Transactional(readOnly = true)
    public List<DespesaResponse> listar() {
        return despesaRepository.findAllByOrderByDataDesc().stream().map(DespesaResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public List<DespesaResponse> listarPorPeriodo(LocalDate inicio, LocalDate fim) {
        validarPeriodo(inicio, fim);
        return despesaRepository.findByDataBetweenOrderByDataDesc(inicio, fim)
                .stream().map(DespesaResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public List<DespesaResponse> listarPorCategoria(String categoria) {
        return despesaRepository.findByCategoriaIgnoreCaseOrderByDataDesc(categoria)
                .stream().map(DespesaResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public List<DespesaResponse> listarPorBarbeiro(Long barbeiroId) {
        return despesaRepository.findByBarbeiroIdOrderByDataDesc(barbeiroId)
                .stream().map(DespesaResponse::de).toList();
    }

    /** Categorias já usadas — alimenta o autocompletar do formulário. */
    @Transactional(readOnly = true)
    public List<String> listarCategorias() {
        return despesaRepository.listarCategorias();
    }

    @Transactional(readOnly = true)
    public DespesaResponse buscarPorId(Long id) {
        return DespesaResponse.de(carregar(id));
    }

    @Transactional
    public DespesaResponse cadastrar(DespesaRequest request) {
        Despesa despesa = new Despesa(
                request.categoria().trim(),
                request.valor(),
                request.data(),
                request.descricao());
        despesa.setBarbeiro(resolverBarbeiro(request.barbeiroId()));
        return DespesaResponse.de(despesaRepository.save(despesa));
    }

    @Transactional
    public DespesaResponse editar(Long id, DespesaRequest request) {
        Despesa despesa = carregar(id);
        despesa.editar(
                request.categoria().trim(),
                request.valor(),
                request.data(),
                request.descricao());
        despesa.setBarbeiro(resolverBarbeiro(request.barbeiroId()));
        return DespesaResponse.de(despesaRepository.save(despesa));
    }

    @Transactional
    public void excluir(Long id) {
        despesaRepository.delete(carregar(id));
    }

    private Barbeiro resolverBarbeiro(Long barbeiroId) {
        if (barbeiroId == null) {
            return null;
        }
        return barbeiroRepository.findById(barbeiroId)
                .orElseThrow(() -> RecursoNaoEncontradoException.de("Barbeiro", barbeiroId));
    }

    private void validarPeriodo(LocalDate inicio, LocalDate fim) {
        if (inicio == null || fim == null) {
            throw new RegraNegocioException("Informe a data inicial e a data final do período");
        }
        if (inicio.isAfter(fim)) {
            throw new RegraNegocioException("A data inicial não pode ser posterior à data final");
        }
    }

    private Despesa carregar(Long id) {
        return despesaRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.de("Despesa", id));
    }
}
