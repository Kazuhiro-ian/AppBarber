package com.barber.app.controller;

import com.barber.app.dto.barbeiro.AgendaDiaResponse;
import com.barber.app.dto.barbeiro.BarbeiroPerfilRequest;
import com.barber.app.dto.barbeiro.BarbeiroResponse;
import com.barber.app.dto.barbeiro.ComissaoResponse;
import com.barber.app.dto.barbeiro.NovoBarbeiroRequest;
import com.barber.app.dto.barbeiro.PainelBarbeiroResponse;
import com.barber.app.service.BarbeiroService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Barbeiros: catálogo para o cliente escolher, perfil profissional, painel do
 * dia e comissões. Endpoints sem {@code barbeiroId} operam sobre o usuário logado.
 */
@RestController
@RequestMapping("/api/barbeiros")
public class BarbeiroController {

    private final BarbeiroService barbeiroService;

    public BarbeiroController(BarbeiroService barbeiroService) {
        this.barbeiroService = barbeiroService;
    }

    /** Barbeiros ativos — é o que a tela de agendamento do cliente consome. */
    @GetMapping
    public List<BarbeiroResponse> listar() {
        return barbeiroService.listarDisponiveis();
    }

    /** Lista completa (inclui inativos, comissão e contato). */
    @GetMapping("/gerenciar")
    @PreAuthorize("hasRole('ADMIN')")
    public List<BarbeiroResponse> listarTodos() {
        return barbeiroService.listarTodos();
    }

    /** Perfil do barbeiro autenticado. */
    @GetMapping("/eu")
    @PreAuthorize("hasRole('BARBEIRO')")
    public BarbeiroResponse meuPerfil() {
        return barbeiroService.meuPerfil();
    }

    /** Visão geral do dia do barbeiro (tela inicial do perfil BARBEIRO). */
    @GetMapping("/painel")
    @PreAuthorize("hasAnyRole('BARBEIRO', 'ADMIN')")
    public PainelBarbeiroResponse painel(
            @RequestParam(required = false) Long barbeiroId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return barbeiroService.painel(barbeiroId, data);
    }

    /** Agenda do dia com os totalizadores do topo da tela. */
    @GetMapping("/agenda")
    @PreAuthorize("hasAnyRole('BARBEIRO', 'ADMIN')")
    public AgendaDiaResponse agenda(
            @RequestParam(required = false) Long barbeiroId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return barbeiroService.agendaDoDia(barbeiroId, data);
    }

    /** Comissão do período (padrão: mês corrente). */
    @GetMapping("/comissao")
    @PreAuthorize("hasAnyRole('BARBEIRO', 'ADMIN')")
    public ComissaoResponse comissao(
            @RequestParam(required = false) Long barbeiroId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        return barbeiroService.calcularComissao(barbeiroId, inicio, fim);
    }

    @GetMapping("/{id}")
    public BarbeiroResponse buscar(@PathVariable Long id) {
        return barbeiroService.buscarPorId(id);
    }

    /** Cadastro de barbeiro (cria usuário + perfil profissional). */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BarbeiroResponse> cadastrar(@Valid @RequestBody NovoBarbeiroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(barbeiroService.cadastrar(request));
    }

    /** O barbeiro edita horários e especialidades do próprio perfil. */
    @PutMapping("/eu")
    @PreAuthorize("hasRole('BARBEIRO')")
    public BarbeiroResponse atualizarMeuPerfil(@Valid @RequestBody BarbeiroPerfilRequest request) {
        return barbeiroService.atualizarPerfil(null, request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public BarbeiroResponse atualizar(@PathVariable Long id, @Valid @RequestBody BarbeiroPerfilRequest request) {
        return barbeiroService.atualizarPerfil(id, request);
    }

    /** Ativa ou inativa o barbeiro (o histórico de atendimentos é preservado). */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public BarbeiroResponse alterarStatus(@PathVariable Long id, @RequestParam boolean ativo) {
        return barbeiroService.alterarStatus(id, ativo);
    }
}
