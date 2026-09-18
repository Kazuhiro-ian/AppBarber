package com.barber.app.controller;

import com.barber.app.dto.produto.MovimentacaoEstoqueRequest;
import com.barber.app.dto.produto.ProdutoRequest;
import com.barber.app.dto.produto.ProdutoResponse;
import com.barber.app.service.ProdutoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

/** Gestão de estoque. Acesso restrito a ADMIN e BARBEIRO (ver SecurityConfig). */
@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    private final ProdutoService produtoService;

    public ProdutoController(ProdutoService produtoService) {
        this.produtoService = produtoService;
    }

    @GetMapping
    public List<ProdutoResponse> listar(
            @RequestParam(name = "nome", required = false) String nome,
            @RequestParam(name = "categoria", required = false) String categoria) {
        if (nome != null && !nome.isBlank()) {
            return produtoService.buscarPorNome(nome);
        }
        if (categoria != null && !categoria.isBlank()) {
            return produtoService.listarPorCategoria(categoria);
        }
        return produtoService.listar();
    }

    @GetMapping("/estoque-baixo")
    public List<ProdutoResponse> estoqueBaixo() {
        return produtoService.listarEstoqueBaixo();
    }

    @GetMapping("/{id}")
    public ProdutoResponse buscar(@PathVariable Long id) {
        return produtoService.buscarPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProdutoResponse> cadastrar(@Valid @RequestBody ProdutoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(produtoService.cadastrar(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProdutoResponse editar(@PathVariable Long id, @Valid @RequestBody ProdutoRequest request) {
        return produtoService.editar(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        produtoService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    /** Saída de estoque (consumo no atendimento) — permitida também ao barbeiro. */
    @PatchMapping("/{id}/baixa")
    public ProdutoResponse darBaixa(@PathVariable Long id,
                                    @Valid @RequestBody MovimentacaoEstoqueRequest request) {
        return produtoService.darBaixaEstoque(id, request.quantidade());
    }

    /** Entrada de estoque (reposição). */
    @PatchMapping("/{id}/entrada")
    @PreAuthorize("hasRole('ADMIN')")
    public ProdutoResponse repor(@PathVariable Long id,
                                 @Valid @RequestBody MovimentacaoEstoqueRequest request) {
        return produtoService.repor(id, request.quantidade());
    }
}
