package com.barber.app.controller;

import com.barber.app.dto.despesa.DespesaRequest;
import com.barber.app.dto.despesa.DespesaResponse;
import com.barber.app.service.DespesaService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/** Despesas da barbearia — base de gastos da Gestão Financeira. Restrito ao ADMIN. */
@RestController
@RequestMapping("/api/despesas")
@PreAuthorize("hasRole('ADMIN')")
public class DespesaController {

    private final DespesaService despesaService;

    public DespesaController(DespesaService despesaService) {
        this.despesaService = despesaService;
    }

    @GetMapping
    public List<DespesaResponse> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) Long barbeiroId) {
        if (inicio != null && fim != null) {
            return despesaService.listarPorPeriodo(inicio, fim);
        }
        if (categoria != null && !categoria.isBlank()) {
            return despesaService.listarPorCategoria(categoria);
        }
        if (barbeiroId != null) {
            return despesaService.listarPorBarbeiro(barbeiroId);
        }
        return despesaService.listar();
    }

    /** Categorias já cadastradas, para sugerir no formulário. */
    @GetMapping("/categorias")
    public List<String> categorias() {
        return despesaService.listarCategorias();
    }

    @GetMapping("/{id}")
    public DespesaResponse buscar(@PathVariable Long id) {
        return despesaService.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<DespesaResponse> cadastrar(@Valid @RequestBody DespesaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(despesaService.cadastrar(request));
    }

    @PutMapping("/{id}")
    public DespesaResponse editar(@PathVariable Long id, @Valid @RequestBody DespesaRequest request) {
        return despesaService.editar(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        despesaService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
