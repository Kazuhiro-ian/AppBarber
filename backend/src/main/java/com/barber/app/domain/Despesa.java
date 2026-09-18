package com.barber.app.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "despesa")
@Getter
@Setter
@NoArgsConstructor
public class Despesa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String categoria;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @Column(nullable = false)
    private LocalDate data;

    @Column(length = 300)
    private String descricao;

    /** Barbeiro a que a despesa se refere, quando aplicável (0..*). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barbeiro_id")
    private Barbeiro barbeiro;

    public Despesa(String categoria, BigDecimal valor, LocalDate data, String descricao) {
        this.categoria = categoria;
        this.valor = valor;
        this.data = data;
        this.descricao = descricao;
    }

    public void editar(String categoria, BigDecimal valor, LocalDate data, String descricao) {
        this.categoria = categoria;
        this.valor = valor;
        this.data = data;
        this.descricao = descricao;
    }
}
