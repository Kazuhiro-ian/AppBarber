package com.barber.app.controller;

import com.barber.app.dto.cliente.ClienteResponse;
import com.barber.app.dto.cliente.HomeClienteResponse;
import com.barber.app.service.ClienteService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    /** Home do cliente: próximos agendamentos, totais e assinatura, em uma chamada. */
    @GetMapping("/home")
    @PreAuthorize("hasRole('CLIENTE')")
    public HomeClienteResponse home() {
        return clienteService.home();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<ClienteResponse> listar(@RequestParam(required = false) String nome) {
        return clienteService.listar(nome);
    }

    @GetMapping("/assinantes")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ClienteResponse> assinantes() {
        return clienteService.listarAssinantes();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ClienteResponse buscar(@PathVariable Long id) {
        return clienteService.buscarPorId(id);
    }
}
