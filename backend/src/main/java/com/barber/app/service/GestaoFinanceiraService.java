package com.barber.app.service;

import com.barber.app.domain.Barbeiro;
import com.barber.app.dto.barbeiro.ComissaoResponse;
import com.barber.app.dto.financeiro.ComparativoPeriodosResponse;
import com.barber.app.dto.financeiro.RelatorioFinanceiroResponse;
import com.barber.app.dto.financeiro.RelatorioFinanceiroResponse.LinhaRelatorio;
import com.barber.app.dto.financeiro.RelatorioFinanceiroResponse.PontoSerie;
import com.barber.app.dto.financeiro.ResumoDashboardResponse;
import com.barber.app.dto.financeiro.ResumoFinanceiroResponse;
import com.barber.app.domain.enums.StatusAgendamento;
import com.barber.app.exception.RegraNegocioException;
import com.barber.app.repository.AgendamentoRepository;
import com.barber.app.repository.AssinaturaRepository;
import com.barber.app.repository.BarbeiroRepository;
import com.barber.app.repository.ClienteRepository;
import com.barber.app.repository.DespesaRepository;
import com.barber.app.repository.ProdutoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Agrega receita (agendamentos concluídos) e gastos (despesas) por período.
 * Não corresponde a nenhuma tabela: é cálculo sobre as demais entidades.
 */
@Service
public class GestaoFinanceiraService {

    private final AgendamentoRepository agendamentoRepository;
    private final DespesaRepository despesaRepository;
    private final AssinaturaRepository assinaturaRepository;
    private final BarbeiroRepository barbeiroRepository;
    private final ProdutoRepository produtoRepository;
    private final ClienteRepository clienteRepository;

    public GestaoFinanceiraService(AgendamentoRepository agendamentoRepository,
                                   DespesaRepository despesaRepository,
                                   AssinaturaRepository assinaturaRepository,
                                   BarbeiroRepository barbeiroRepository,
                                   ProdutoRepository produtoRepository,
                                   ClienteRepository clienteRepository) {
        this.agendamentoRepository = agendamentoRepository;
        this.despesaRepository = despesaRepository;
        this.assinaturaRepository = assinaturaRepository;
        this.barbeiroRepository = barbeiroRepository;
        this.produtoRepository = produtoRepository;
        this.clienteRepository = clienteRepository;
    }

    @Transactional(readOnly = true)
    public ResumoFinanceiroResponse calcularSaldo(LocalDate inicio, LocalDate fim) {
        validarPeriodo(inicio, fim);
        BigDecimal ganhos = naoNulo(agendamentoRepository.somarReceitaPorPeriodo(inicio, fim));
        BigDecimal gastos = naoNulo(despesaRepository.somarPorPeriodo(inicio, fim));
        return new ResumoFinanceiroResponse(inicio, fim, ganhos, gastos, ganhos.subtract(gastos));
    }

    /**
     * Relatório gerencial do período: saldo, origem da receita, destino dos
     * gastos, evolução diária e comissões a pagar.
     */
    @Transactional(readOnly = true)
    public RelatorioFinanceiroResponse gerarRelatorio(LocalDate inicio, LocalDate fim) {
        validarPeriodo(inicio, fim);

        BigDecimal receitaServicos = naoNulo(agendamentoRepository.somarReceitaPorPeriodo(inicio, fim));
        BigDecimal receitaAssinaturas = naoNulo(assinaturaRepository.somarReceitaPorPeriodo(inicio, fim));
        BigDecimal gastos = naoNulo(despesaRepository.somarPorPeriodo(inicio, fim));
        long concluidos = agendamentoRepository.countByDataBetweenAndStatus(
                inicio, fim, StatusAgendamento.CONCLUIDO);

        List<LinhaRelatorio> porServico = agendamentoRepository.totalizarPorServico(inicio, fim)
                .stream()
                .map(linha -> new LinhaRelatorio(
                        (String) linha[1], ((Number) linha[2]).longValue(), paraDecimal(linha[3])))
                .toList();

        List<Object[]> totaisPorBarbeiro = agendamentoRepository.totalizarPorBarbeiro(inicio, fim);

        List<LinhaRelatorio> porBarbeiro = totaisPorBarbeiro.stream()
                .map(linha -> new LinhaRelatorio(
                        (String) linha[1], ((Number) linha[2]).longValue(), paraDecimal(linha[3])))
                .toList();

        List<LinhaRelatorio> porCategoria = despesaRepository.totalizarPorCategoria(inicio, fim)
                .stream()
                .map(linha -> new LinhaRelatorio(
                        (String) linha[0], ((Number) linha[1]).longValue(), paraDecimal(linha[2])))
                .toList();

        List<PontoSerie> evolucao = agendamentoRepository.totalizarPorDia(inicio, fim)
                .stream()
                .map(linha -> new PontoSerie(
                        (LocalDate) linha[0], paraDecimal(linha[1]), ((Number) linha[2]).longValue()))
                .toList();

        List<ComissaoResponse> comissoes = montarComissoes(totaisPorBarbeiro, inicio, fim);
        BigDecimal totalComissoes = comissoes.stream()
                .map(ComissaoResponse::valorComissao)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal ticketMedio = concluidos > 0
                ? receitaServicos.divide(BigDecimal.valueOf(concluidos), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new RelatorioFinanceiroResponse(
                inicio,
                fim,
                receitaServicos,
                gastos,
                receitaServicos.subtract(gastos),
                receitaServicos,
                receitaAssinaturas,
                totalComissoes,
                concluidos,
                ticketMedio,
                porServico,
                porBarbeiro,
                porCategoria,
                evolucao,
                comissoes);
    }

    @Transactional(readOnly = true)
    public ComparativoPeriodosResponse compararPeriodos(LocalDate inicioA, LocalDate fimA,
                                                       LocalDate inicioB, LocalDate fimB) {
        ResumoFinanceiroResponse a = calcularSaldo(inicioA, fimA);
        ResumoFinanceiroResponse b = calcularSaldo(inicioB, fimB);
        return new ComparativoPeriodosResponse(
                a,
                b,
                b.ganhos().subtract(a.ganhos()),
                b.gastos().subtract(a.gastos()),
                b.saldoLiquido().subtract(a.saldoLiquido()));
    }

    /** Indicadores do topo do painel administrativo (hoje + mês corrente). */
    @Transactional(readOnly = true)
    public ResumoDashboardResponse resumoDashboard() {
        LocalDate hoje = LocalDate.now();
        LocalDate inicioMes = hoje.withDayOfMonth(1);
        LocalDate fimMes = hoje.withDayOfMonth(hoje.lengthOfMonth());

        BigDecimal faturamentoHoje = naoNulo(agendamentoRepository.somarReceitaPorPeriodo(hoje, hoje));
        BigDecimal faturamentoMes = naoNulo(agendamentoRepository.somarReceitaPorPeriodo(inicioMes, fimMes));
        BigDecimal despesasMes = naoNulo(despesaRepository.somarPorPeriodo(inicioMes, fimMes));

        return new ResumoDashboardResponse(
                agendamentoRepository.countByDataAndStatus(hoje, StatusAgendamento.CONFIRMADO)
                        + agendamentoRepository.countByDataAndStatus(hoje, StatusAgendamento.CONCLUIDO),
                agendamentoRepository.countByDataAndStatus(hoje, StatusAgendamento.CONCLUIDO),
                agendamentoRepository.countByDataBetweenAndStatus(inicioMes, fimMes, StatusAgendamento.CONCLUIDO),
                faturamentoHoje,
                faturamentoMes,
                despesasMes,
                faturamentoMes.subtract(despesasMes),
                produtoRepository.findAbaixoDoEstoqueMinimo().size(),
                barbeiroRepository.findByAtivoTrueOrderByNomeAsc().size(),
                clienteRepository.findByAssinaturaAtivaIsNotNullOrderByNomeAsc().size());
    }

    // ------------------------------------------------------------------

    /** Cruza o faturamento por barbeiro com o percentual de comissão de cada um. */
    private List<ComissaoResponse> montarComissoes(List<Object[]> totais, LocalDate inicio, LocalDate fim) {
        Map<Long, Barbeiro> barbeiros = barbeiroRepository.findAllByOrderByNomeAsc()
                .stream()
                .collect(Collectors.toMap(Barbeiro::getId, Function.identity()));

        return totais.stream().map(linha -> {
            Long barbeiroId = ((Number) linha[0]).longValue();
            String nome = (String) linha[1];
            long quantidade = ((Number) linha[2]).longValue();
            BigDecimal faturamento = paraDecimal(linha[3]);

            Barbeiro barbeiro = barbeiros.get(barbeiroId);
            BigDecimal percentual = barbeiro != null && barbeiro.getComissao() != null
                    ? barbeiro.getComissao()
                    : BigDecimal.ZERO;
            BigDecimal valor = faturamento.multiply(percentual)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            return new ComissaoResponse(barbeiroId, nome, inicio, fim, quantidade, faturamento, percentual, valor);
        }).toList();
    }

    private void validarPeriodo(LocalDate inicio, LocalDate fim) {
        if (inicio == null || fim == null) {
            throw new RegraNegocioException("Informe a data inicial e a data final do período");
        }
        if (inicio.isAfter(fim)) {
            throw new RegraNegocioException("A data inicial não pode ser posterior à data final");
        }
    }

    /** Converte o total agregado da consulta nativa/JPQL em BigDecimal. */
    private BigDecimal paraDecimal(Object valor) {
        return switch (valor) {
            case null -> BigDecimal.ZERO;
            case BigDecimal decimal -> decimal;
            case Number numero -> BigDecimal.valueOf(numero.doubleValue());
            default -> new BigDecimal(valor.toString());
        };
    }

    private BigDecimal naoNulo(BigDecimal valor) {
        return valor != null ? valor : BigDecimal.ZERO;
    }
}
