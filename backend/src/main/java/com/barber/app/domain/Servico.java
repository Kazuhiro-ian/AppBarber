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
@Table(name = "servico")
@Getter
@Setter
@NoArgsConstructor
public class Servico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(length = 80)
    private String categoria;

    @Column(name = "duracao_minutos", nullable = false)
    private int duracaoMinutos;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal preco;

    @Column(nullable = false)
    private boolean ativo = true;

    public Servico(String nome, String categoria, int duracaoMinutos, BigDecimal preco) {
        this.nome = nome;
        this.categoria = categoria;
        this.duracaoMinutos = duracaoMinutos;
        this.preco = preco;
        this.ativo = true;
    }

    public void editar(String nome, String categoria, int duracaoMinutos, BigDecimal preco, boolean ativo) {
        this.nome = nome;
        this.categoria = categoria;
        this.duracaoMinutos = duracaoMinutos;
        this.preco = preco;
        this.ativo = ativo;
    }

    /** Serviços não são excluídos: são inativados para preservar o histórico de agendamentos. */
    public void inativar() {
        this.ativo = false;
    }

    public void reativar() {
        this.ativo = true;
    }
}
