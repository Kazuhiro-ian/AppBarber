package com.barber.app.controller;

import com.barber.app.dto.assinatura.AssinaturaResponse;
import com.barber.app.service.AssinaturaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Assinatura do cliente autenticado: contratar, consultar, renovar e cancelar. */
@RestController
@RequestMapping("/api/assinaturas")
@PreAuthorize("hasRole('CLIENTE')")
public class AssinaturaController {

    private final AssinaturaService assinaturaService;

    public AssinaturaController(AssinaturaService assinaturaService) {
        this.assinaturaService = assinaturaService;
    }

    /** Assinatura vigente, ou 204 quando o cliente ainda não assinou nenhum plano. */
    @GetMapping("/minha")
    public ResponseEntity<AssinaturaResponse> minha() {
        AssinaturaResponse assinatura = assinaturaService.minhaAssinatura();
        return assinatura != null ? ResponseEntity.ok(assinatura) : ResponseEntity.noContent().build();
    }

    @PostMapping("/planos/{planoId}")
    public ResponseEntity<AssinaturaResponse> assinar(@PathVariable Long planoId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assinaturaService.assinar(planoId));
    }

    @PatchMapping("/minha/renovar")
    public AssinaturaResponse renovar() {
        return assinaturaService.renovarAssinatura();
    }

    @DeleteMapping("/minha")
    public AssinaturaResponse cancelar() {
        return assinaturaService.cancelarAssinatura();
    }
}
