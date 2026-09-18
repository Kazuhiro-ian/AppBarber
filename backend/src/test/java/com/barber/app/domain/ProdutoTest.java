package com.barber.app.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Produto (estoque)")
class ProdutoTest {

    @Test
    @DisplayName("baixa reduz o estoque disponível")
    void darBaixa() {
        Produto produto = novo(10, 3);

        produto.darBaixaEstoque(4);

        assertThat(produto.getQuantidade()).isEqualTo(6);
    }

    @Test
    @DisplayName("não permite baixa maior que o estoque")
    void baixaAlemDoEstoque() {
        Produto produto = novo(2, 1);

        assertThatThrownBy(() -> produto.darBaixaEstoque(5))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Estoque insuficiente");
        assertThat(produto.getQuantidade()).isEqualTo(2);
    }

    @Test
    @DisplayName("não permite movimentação com quantidade zero ou negativa")
    void quantidadeInvalida() {
        Produto produto = novo(10, 3);

        assertThatThrownBy(() -> produto.darBaixaEstoque(0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> produto.repor(-1)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("alerta de estoque mínimo dispara ao atingir o limite")
    void alertaDeEstoqueMinimo() {
        Produto produto = novo(10, 8);
        assertThat(produto.verificarEstoqueMinimo()).isFalse();

        produto.darBaixaEstoque(2);

        assertThat(produto.verificarEstoqueMinimo()).isTrue();
    }

    @Test
    @DisplayName("reposição soma ao estoque e desliga o alerta")
    void reposicao() {
        Produto produto = novo(5, 8);
        assertThat(produto.verificarEstoqueMinimo()).isTrue();

        produto.repor(10);

        assertThat(produto.getQuantidade()).isEqualTo(15);
        assertThat(produto.verificarEstoqueMinimo()).isFalse();
    }

    @Test
    @DisplayName("margem unitária é a diferença entre venda e custo")
    void margem() {
        Produto produto = novo(10, 3);

        assertThat(produto.margemUnitaria()).isEqualByComparingTo("21.90");
    }

    private Produto novo(int quantidade, int minima) {
        return new Produto("Pomada", "Finalizador", quantidade, minima,
                new BigDecimal("18.00"), new BigDecimal("39.90"));
    }
}
