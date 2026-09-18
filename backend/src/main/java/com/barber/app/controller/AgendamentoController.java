package com.barber.app.controller;

import com.barber.app.dto.agendamento.AgendamentoRequest;
import com.barber.app.dto.agendamento.AgendamentoResponse;
import com.barber.app.dto.agendamento.DisponibilidadeResponse;
import com.barber.app.dto.agendamento.RemarcarRequest;
import com.barber.app.service.AgendamentoService;
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
 * Agendamentos. As regras de quem pode ver ou alterar cada registro ficam no
 * service, porque dependem do vínculo com o cliente ou com o barbeiro.
 */
@RestController
@RequestMapping("/api/agendamentos")
public class AgendamentoController {

    private final AgendamentoService agendamentoService;

    public AgendamentoController(AgendamentoService agendamentoService) {
        this.agendamentoService = agendamentoService;
    }

    /** Grade de horários livres do barbeiro no dia, já considerando a duração do serviço. */
    @GetMapping("/disponibilidade")
    public DisponibilidadeResponse disponibilidade(
            @RequestParam Long barbeiroId,
            @RequestParam Long servicoId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return agendamentoService.consultarDisponibilidade(barbeiroId, data, servicoId);
    }

    /** Histórico do cliente autenticado (o ADMIN pode informar {@code clienteId}). */
    @GetMapping("/meus")
    public List<AgendamentoResponse> meus(@RequestParam(required = false) Long clienteId) {
        return agendamentoService.historicoDoCliente(clienteId);
    }

    @GetMapping("/meus/proximos")
    public List<AgendamentoResponse> meusProximos(@RequestParam(required = false) Long clienteId) {
        return agendamentoService.proximosDoCliente(clienteId);
    }

    /** Agenda de um barbeiro em um dia. Sem {@code barbeiroId}, usa o barbeiro logado. */
    @GetMapping("/agenda")
    @PreAuthorize("hasAnyRole('BARBEIRO', 'ADMIN')")
    public List<AgendamentoResponse> agenda(
            @RequestParam(required = false) Long barbeiroId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return agendamentoService.agendaDoBarbeiro(barbeiroId, data);
    }

    /** Agenda da barbearia inteira em um dia. */
    @GetMapping("/dia")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AgendamentoResponse> dia(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return agendamentoService.agendaDoDia(data);
    }

    @GetMapping("/{id}")
    public AgendamentoResponse buscar(@PathVariable Long id) {
        return agendamentoService.buscarPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN')")
    public ResponseEntity<AgendamentoResponse> agendar(@Valid @RequestBody AgendamentoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(agendamentoService.agendar(request));
    }

    @PutMapping("/{id}/remarcar")
    @PreAuthorize("hasAnyRole('CLIENTE', 'ADMIN')")
    public AgendamentoResponse remarcar(@PathVariable Long id, @Valid @RequestBody RemarcarRequest request) {
        return agendamentoService.remarcar(id, request);
    }

    /** Cancelamento pelo cliente, pelo barbeiro do atendimento ou pelo ADMIN. */
    @PatchMapping("/{id}/cancelar")
    public AgendamentoResponse cancelar(@PathVariable Long id) {
        return agendamentoService.cancelar(id);
    }

    /** Conclusão do atendimento — barbeiro responsável ou ADMIN. */
    @PatchMapping("/{id}/concluir")
    @PreAuthorize("hasAnyRole('BARBEIRO', 'ADMIN')")
    public AgendamentoResponse concluir(@PathVariable Long id) {
        return agendamentoService.concluir(id);
    }
}
