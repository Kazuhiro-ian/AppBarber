package com.barber.app.dto.financeiro;

import com.barber.app.dto.barbeiro.ComissaoResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Relatório gerencial do período. Além do saldo, detalha a origem da receita
 * e o destino dos gastos, para a tela de Gestão Financeira.
 *
 * @param receitaServicos    atendimentos concluídos no período
 * @param receitaAssinaturas assinaturas contratadas no período (informativo)
 * @param comissoes          quanto cada barbeiro tem a receber no período
 */
public record RelatorioFinanceiroResponse(
        LocalDate periodoInicio,
        LocalDate periodoFim,
        BigDecimal ganhos,
        BigDecimal gastos,
        BigDecimal saldoLiquido,
        BigDecimal receitaServicos,
        BigDecimal receitaAssinaturas,
        BigDecimal totalComissoes,
        long atendimentosConcluidos,
        BigDecimal ticketMedio,
        List<LinhaRelatorio> receitaPorServico,
        List<LinhaRelatorio> receitaPorBarbeiro,
        List<LinhaRelatorio> gastosPorCategoria,
        List<PontoSerie> evolucaoDiaria,
        List<ComissaoResponse> comissoes) {

    /** Linha de agrupamento: rótulo, quantidade e total. */
    public record LinhaRelatorio(String rotulo, long quantidade, BigDecimal total) {
    }

    /** Ponto do gráfico de evolução diária. */
    public record PontoSerie(LocalDate data, BigDecimal valor, long quantidade) {
    }
}
