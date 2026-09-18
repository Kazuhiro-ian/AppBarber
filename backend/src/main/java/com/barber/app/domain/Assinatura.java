package com.barber.app.domain;

import com.barber.app.domain.enums.Periodicidade;
import com.barber.app.domain.enums.StatusAssinatura;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import java.util.ArrayList;
import java.util.List;

/**
 * Cumpre dois papéis, distinguidos por {@link #modelo}:
 * <ul>
 *   <li>{@code modelo = true}: plano do catálogo, mantido pelo ADMIN e exibido ao cliente;</li>
 *   <li>{@code modelo = false}: assinatura de um cliente — cópia do plano com vigência própria.</li>
 * </ul>
 * A cópia evita que o cancelamento de um cliente altere o plano visto pelos demais.
 */
@Entity
@Table(name = "assinatura")
@Getter
@Setter
@NoArgsConstructor
public class Assinatura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "assinatura_beneficio", joinColumns = @JoinColumn(name = "assinatura_id"))
    @Column(name = "beneficio", nullable = false, length = 200)
    private List<String> beneficios = new ArrayList<>();

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal preco;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Periodicidade periodicidade;

    @Column(name = "data_inicio")
    private LocalDate dataInicio;

    @Column(name = "data_renovacao")
    private LocalDate dataRenovacao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusAssinatura status = StatusAssinatura.ATIVA;

    /** {@code true} para os planos do catálogo; {@code false} para a assinatura de um cliente. */
    @Column(nullable = false)
    private boolean modelo = false;

    /** Só vale para o catálogo: plano disponível para contratação. */
    @Column(nullable = false)
    private boolean ativo = true;

    /** Plano de origem da assinatura do cliente (nulo no próprio catálogo). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plano_id")
    private Assinatura plano;

    public Assinatura(String nome, List<String> beneficios, BigDecimal preco, Periodicidade periodicidade) {
        this.nome = nome;
        this.beneficios = beneficios != null ? new ArrayList<>(beneficios) : new ArrayList<>();
        this.preco = preco;
        this.periodicidade = periodicidade;
    }

    /** Cria o plano do catálogo (sem vigência: quem tem vigência é a assinatura do cliente). */
    public static Assinatura novoPlano(String nome, List<String> beneficios, BigDecimal preco,
                                       Periodicidade periodicidade) {
        Assinatura plano = new Assinatura(nome, beneficios, preco, periodicidade);
        plano.modelo = true;
        plano.ativo = true;
        plano.status = StatusAssinatura.ATIVA;
        return plano;
    }

    /** Cópia deste plano para um cliente, já ativada a partir de hoje. */
    public Assinatura contratar() {
        if (!modelo) {
            throw new IllegalStateException("Só é possível contratar um plano do catálogo");
        }
        if (!ativo) {
            throw new IllegalStateException("O plano '%s' não está disponível para contratação".formatted(nome));
        }
        Assinatura contratada = new Assinatura(nome, beneficios, preco, periodicidade);
        contratada.modelo = false;
        contratada.plano = this;
        contratada.ativar();
        return contratada;
    }

    public void editarPlano(String nome, List<String> beneficios, BigDecimal preco,
                            Periodicidade periodicidade, boolean ativo) {
        this.nome = nome;
        this.beneficios = beneficios != null ? new ArrayList<>(beneficios) : new ArrayList<>();
        this.preco = preco;
        this.periodicidade = periodicidade;
        this.ativo = ativo;
    }

    public void ativar() {
        this.dataInicio = LocalDate.now();
        this.dataRenovacao = periodicidade.proximaRenovacao(this.dataInicio);
        this.status = StatusAssinatura.ATIVA;
    }

    public void cancelar() {
        this.status = StatusAssinatura.CANCELADA;
    }

    /** Estende a vigência por mais um período a partir da renovação atual. */
    public void renovar() {
        if (status == StatusAssinatura.CANCELADA) {
            throw new IllegalStateException("Assinatura cancelada não pode ser renovada");
        }
        LocalDate base = dataRenovacao != null && dataRenovacao.isAfter(LocalDate.now())
                ? dataRenovacao
                : LocalDate.now();
        this.dataRenovacao = periodicidade.proximaRenovacao(base);
        this.status = StatusAssinatura.ATIVA;
    }

    /** Vigente hoje? Marca como EXPIRADA quando a data de renovação já passou. */
    public boolean verificarValidade() {
        if (status != StatusAssinatura.ATIVA) {
            return false;
        }
        if (dataRenovacao != null && dataRenovacao.isBefore(LocalDate.now())) {
            this.status = StatusAssinatura.EXPIRADA;
            return false;
        }
        return true;
    }

    /** Quantos dias faltam para a próxima renovação (negativo se já venceu). */
    public long diasParaRenovacao() {
        if (dataRenovacao == null) {
            return 0;
        }
        return java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), dataRenovacao);
    }
}
