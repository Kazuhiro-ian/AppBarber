package com.barber.app.controller;

import com.barber.app.dto.servico.ServicoRequest;
import com.barber.app.dto.servico.ServicoResponse;
import com.barber.app.service.ServicoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** CRUD de serviços. Leitura é pública; escrita exige ADMIN (ver SecurityConfig). */
@RestController
@RequestMapping("/api/servicos")
public class ServicoController {

    private final ServicoService servicoService;

    public ServicoController(ServicoService servicoService) {
        this.servicoService = servicoService;
    }

    @GetMapping
    public List<ServicoResponse> listar(
            @RequestParam(name = "apenasAtivos", defaultValue = "true") boolean apenasAtivos,
            @RequestParam(name = "categoria", required = false) String categoria) {
        if (categoria != null && !categoria.isBlank()) {
            return servicoService.listarPorCategoria(categoria);
        }
        return servicoService.listar(apenasAtivos);
    }

    @GetMapping("/{id}")
    public ServicoResponse buscar(@PathVariable Long id) {
        return servicoService.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<ServicoResponse> cadastrar(@Valid @RequestBody ServicoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(servicoService.cadastrar(request));
    }

    @PutMapping("/{id}")
    public ServicoResponse editar(@PathVariable Long id, @Valid @RequestBody ServicoRequest request) {
        return servicoService.editar(id, request);
    }

    /** "Exclusão" lógica: o serviço é inativado. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> inativar(@PathVariable Long id) {
        servicoService.inativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/reativar")
    public ServicoResponse reativar(@PathVariable Long id) {
        return servicoService.reativar(id);
    }
}
