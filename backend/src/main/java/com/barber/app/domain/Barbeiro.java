package com.barber.app.domain;

import com.barber.app.domain.enums.StatusAgendamento;
import com.barber.app.domain.enums.TipoUsuario;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "barbeiro")
@PrimaryKeyJoinColumn(name = "id")
@Getter
@Setter
@NoArgsConstructor
public class Barbeiro extends Usuario {

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "barbeiro_especialidade", joinColumns = @JoinColumn(name = "barbeiro_id"))
    @Column(name = "especialidade", nullable = false, length = 80)
    private List<String> especialidades = new ArrayList<>();

    @Column(name = "horario_inicio")
    private LocalTime horarioInicio;

    @Column(name = "horario_fim")
    private LocalTime horarioFim;

    /** Percentual de comissão sobre o valor dos atendimentos (ex.: 40.00 = 40%). */
    @Column(precision = 5, scale = 2)
    private BigDecimal comissao = BigDecimal.ZERO;

    @Column(nullable = false)
    private boolean ativo = true;

    @OneToMany(mappedBy = "barbeiro", fetch = FetchType.LAZY)
    private List<Agendamento> agendamentos = new ArrayList<>();

    @OneToMany(mappedBy = "barbeiro", fetch = FetchType.LAZY)
    private List<Despesa> despesas = new ArrayList<>();

    /** Produtos que o barbeiro consome/utiliza no atendimento. */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "barbeiro_produto",
            joinColumns = @JoinColumn(name = "barbeiro_id"),
            inverseJoinColumns = @JoinColumn(name = "produto_id"))
    private List<Produto> produtos = new ArrayList<>();

    public Barbeiro(String nome, String email, String senha, String telefone) {
        super(nome, email, senha, telefone, TipoUsuario.BARBEIRO);
    }

    public void definirHorarioTrabalho(LocalTime inicio, LocalTime fim) {
        if (inicio != null && fim != null && !inicio.isBefore(fim)) {
            throw new IllegalArgumentException("Horário de início deve ser anterior ao horário de fim");
        }
        this.horarioInicio = inicio;
        this.horarioFim = fim;
    }

    /** O horário informado cabe dentro da jornada configurada? */
    public boolean atendeNoHorario(LocalTime horario, int duracaoMinutos) {
        if (horarioInicio == null || horarioFim == null) {
            return true;
        }
        LocalTime fimAtendimento = horario.plusMinutes(duracaoMinutos);
        return !horario.isBefore(horarioInicio) && !fimAtendimento.isAfter(horarioFim);
    }

    /** Comissão sobre o total dos atendimentos concluídos informados. */
    public BigDecimal calcularComissao(List<Agendamento> atendimentos) {
        if (comissao == null || atendimentos == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal total = atendimentos.stream()
                .filter(a -> a.getStatus() == StatusAgendamento.CONCLUIDO)
                .map(Agendamento::calcularValorTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.multiply(comissao)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }
}
