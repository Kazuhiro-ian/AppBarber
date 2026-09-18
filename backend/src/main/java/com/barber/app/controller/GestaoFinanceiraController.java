package com.barber.app.controller;

import com.barber.app.dto.financeiro.ComparativoPeriodosResponse;
import com.barber.app.dto.financeiro.RelatorioFinanceiroResponse;
import com.barber.app.dto.financeiro.ResumoDashboardResponse;
import com.barber.app.dto.financeiro.ResumoFinanceiroResponse;
import com.barber.app.service.GestaoFinanceiraService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/** Gestão financeira: saldo, relatório gerencial e comparativo entre períodos. */
@RestController
@RequestMapping("/api/financeiro")
public class GestaoFinanceiraController {

    private final GestaoFinanceiraService gestaoFinanceiraService;

    public GestaoFinanceiraController(GestaoFinanceiraService gestaoFinanceiraService) {
        this.gestaoFinanceiraService = gestaoFinanceiraService;
    }

    /** Ganhos, gastos e saldo líquido do período. */
    @GetMapping("/resumo")
    public ResumoFinanceiroResponse resumo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return gestaoFinanceiraService.calcularSaldo(inicio, fim);
    }

    /** Relatório detalhado: receita por serviço/barbeiro, gastos por categoria e comissões. */
    @GetMapping("/relatorio")
    public RelatorioFinanceiroResponse relatorio(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return gestaoFinanceiraService.gerarRelatorio(inicio, fim);
    }

    @GetMapping("/comparativo")
    public ComparativoPeriodosResponse comparativo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicioA,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fimA,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicioB,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fimB) {
        return gestaoFinanceiraService.compararPeriodos(inicioA, fimA, inicioB, fimB);
    }

    /** Indicadores do topo do painel administrativo (hoje + mês corrente). */
    @GetMapping("/dashboard")
    public ResumoDashboardResponse dashboard() {
        return gestaoFinanceiraService.resumoDashboard();
    }
}
