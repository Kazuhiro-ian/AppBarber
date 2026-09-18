package com.barber.app.dto.produto;

import com.barber.app.domain.Produto;

import java.math.BigDecimal;

public record ProdutoResponse(
        Long id,
        String nome,
        String categoria,
        int quantidade,
        int quantidadeMinima,
        BigDecimal precoCusto,
        BigDecimal precoVenda,
        boolean estoqueBaixo) {

    public static ProdutoResponse de(Produto produto) {
        return new ProdutoResponse(
                produto.getId(),
                produto.getNome(),
                produto.getCategoria(),
                produto.getQuantidade(),
                produto.getQuantidadeMinima(),
                produto.getPrecoCusto(),
                produto.getPrecoVenda(),
                produto.verificarEstoqueMinimo());
    }
}
