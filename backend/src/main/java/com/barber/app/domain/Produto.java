package com.barber.app.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "produto")
@Getter
@Setter
@NoArgsConstructor
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(length = 80)
    private String categoria;

    @Column(nullable = false)
    private int quantidade;

    @Column(name = "quantidade_minima", nullable = false)
    private int quantidadeMinima;

    @Column(name = "preco_custo", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoCusto;

    @Column(name = "preco_venda", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoVenda;

    public Produto(String nome, String categoria, int quantidade, int quantidadeMinima,
                   BigDecimal precoCusto, BigDecimal precoVenda) {
        this.nome = nome;
        this.categoria = categoria;
        this.quantidade = quantidade;
        this.quantidadeMinima = quantidadeMinima;
        this.precoCusto = precoCusto;
        this.precoVenda = precoVenda;
    }

    public void editar(String nome, String categoria, int quantidade, int quantidadeMinima,
                       BigDecimal precoCusto, BigDecimal precoVenda) {
        this.nome = nome;
        this.categoria = categoria;
        this.quantidade = quantidade;
        this.quantidadeMinima = quantidadeMinima;
        this.precoCusto = precoCusto;
        this.precoVenda = precoVenda;
    }

    /** Saída de estoque. Lança se não houver quantidade suficiente. */
    public void darBaixaEstoque(int unidades) {
        if (unidades <= 0) {
            throw new IllegalArgumentException("A quantidade da baixa deve ser maior que zero");
        }
        if (unidades > quantidade) {
            throw new IllegalStateException(
                    "Estoque insuficiente para '%s': disponível %d, solicitado %d"
                            .formatted(nome, quantidade, unidades));
        }
        this.quantidade -= unidades;
    }

    /** Entrada de estoque. */
    public void repor(int unidades) {
        if (unidades <= 0) {
            throw new IllegalArgumentException("A quantidade da entrada deve ser maior que zero");
        }
        this.quantidade += unidades;
    }

    public boolean verificarEstoqueMinimo() {
        return quantidade <= quantidadeMinima;
    }

    /** Margem de lucro unitária (venda - custo). */
    public BigDecimal margemUnitaria() {
        if (precoVenda == null || precoCusto == null) {
            return BigDecimal.ZERO;
        }
        return precoVenda.subtract(precoCusto);
    }
}
