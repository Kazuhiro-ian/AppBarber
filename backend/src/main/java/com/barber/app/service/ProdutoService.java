package com.barber.app.service;

import com.barber.app.domain.Produto;
import com.barber.app.dto.produto.ProdutoRequest;
import com.barber.app.dto.produto.ProdutoResponse;
import com.barber.app.exception.RecursoNaoEncontradoException;
import com.barber.app.repository.ProdutoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProdutoService {

    private final ProdutoRepository produtoRepository;

    public ProdutoService(ProdutoRepository produtoRepository) {
        this.produtoRepository = produtoRepository;
    }

    @Transactional(readOnly = true)
    public List<ProdutoResponse> listar() {
        return produtoRepository.findAll().stream().map(ProdutoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public List<ProdutoResponse> buscarPorNome(String nome) {
        return produtoRepository.findByNomeContainingIgnoreCaseOrderByNomeAsc(nome)
                .stream().map(ProdutoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public List<ProdutoResponse> listarPorCategoria(String categoria) {
        return produtoRepository.findByCategoriaIgnoreCaseOrderByNomeAsc(categoria)
                .stream().map(ProdutoResponse::de).toList();
    }

    /** Produtos que atingiram o estoque mínimo — alimenta o alerta da tela de estoque. */
    @Transactional(readOnly = true)
    public List<ProdutoResponse> listarEstoqueBaixo() {
        return produtoRepository.findAbaixoDoEstoqueMinimo().stream().map(ProdutoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public ProdutoResponse buscarPorId(Long id) {
        return ProdutoResponse.de(carregar(id));
    }

    @Transactional
    public ProdutoResponse cadastrar(ProdutoRequest request) {
        Produto produto = new Produto(
                request.nome().trim(),
                request.categoria(),
                request.quantidade(),
                request.quantidadeMinima(),
                request.precoCusto(),
                request.precoVenda());
        return ProdutoResponse.de(produtoRepository.save(produto));
    }

    @Transactional
    public ProdutoResponse editar(Long id, ProdutoRequest request) {
        Produto produto = carregar(id);
        produto.editar(
                request.nome().trim(),
                request.categoria(),
                request.quantidade(),
                request.quantidadeMinima(),
                request.precoCusto(),
                request.precoVenda());
        return ProdutoResponse.de(produtoRepository.save(produto));
    }

    @Transactional
    public void excluir(Long id) {
        Produto produto = carregar(id);
        produtoRepository.delete(produto);
    }

    @Transactional
    public ProdutoResponse darBaixaEstoque(Long id, int quantidade) {
        Produto produto = carregar(id);
        produto.darBaixaEstoque(quantidade);
        return ProdutoResponse.de(produtoRepository.save(produto));
    }

    @Transactional
    public ProdutoResponse repor(Long id, int quantidade) {
        Produto produto = carregar(id);
        produto.repor(quantidade);
        return ProdutoResponse.de(produtoRepository.save(produto));
    }

    private Produto carregar(Long id) {
        return produtoRepository.findById(id)
                .orElseThrow(() -> RecursoNaoEncontradoException.de("Produto", id));
    }
}
