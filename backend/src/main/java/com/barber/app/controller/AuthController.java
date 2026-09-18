package com.barber.app.controller;

import com.barber.app.dto.auth.AlterarSenhaRequest;
import com.barber.app.dto.auth.AtualizarPerfilRequest;
import com.barber.app.dto.auth.AuthResponse;
import com.barber.app.dto.auth.LoginRequest;
import com.barber.app.dto.auth.RegistroRequest;
import com.barber.app.dto.auth.UsuarioResponse;
import com.barber.app.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/registrar")
    public ResponseEntity<AuthResponse> registrar(@Valid @RequestBody RegistroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registrar(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /** Dados do usuário do token — usado pelo frontend para reidratar a sessão. */
    @GetMapping("/eu")
    public UsuarioResponse eu() {
        return authService.usuarioAtual();
    }

    @PutMapping("/perfil")
    public UsuarioResponse atualizarPerfil(@Valid @RequestBody AtualizarPerfilRequest request) {
        return authService.atualizarPerfil(request);
    }

    @PatchMapping("/senha")
    public ResponseEntity<Void> alterarSenha(@Valid @RequestBody AlterarSenhaRequest request) {
        authService.alterarSenha(request);
        return ResponseEntity.noContent().build();
    }
}
