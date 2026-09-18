package com.barber.app.controller;

import com.barber.app.dto.assinatura.PlanoRequest;
import com.barber.app.dto.assinatura.PlanoResponse;
import com.barber.app.service.AssinaturaService;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Catálogo de planos de assinatura. Leitura livre; manutenção só para ADMIN. */
@RestController
@RequestMapping("/api/planos")
public class PlanoController {

    private final AssinaturaService assinaturaService;

    public PlanoController(AssinaturaService assinaturaService) {
        this.assinaturaService = assinaturaService;
    }

    @GetMapping
    public List<PlanoResponse> listar() {
        return assinaturaService.listarPlanos();
    }

    /** Catálogo completo, com planos inativos e número de assinantes. */
    @GetMapping("/gerenciar")
    @PreAuthorize("hasRole('ADMIN')")
    public List<PlanoResponse> listarParaGestao() {
        return assinaturaService.listarPlanosAdmin();
    }

    @GetMapping("/{id}")
    public PlanoResponse buscar(@PathVariable Long id) {
        return assinaturaService.buscarPlano(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlanoResponse> criar(@Valid @RequestBody PlanoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assinaturaService.criarPlano(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public PlanoResponse editar(@PathVariable Long id, @Valid @RequestBody PlanoRequest request) {
        return assinaturaService.editarPlano(id, request);
    }

    /** Remove o plano; se já houver assinantes, ele é apenas desativado. */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        assinaturaService.removerPlano(id);
        return ResponseEntity.noContent().build();
    }
}
