package com.barber.app.security;

import com.barber.app.domain.Usuario;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/** Atalhos para recuperar o usuário autenticado no SecurityContext. */
public final class UsuarioLogado {

    private UsuarioLogado() {
    }

    public static Optional<Usuario> atual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UsuarioAutenticado principal)) {
            return Optional.empty();
        }
        return Optional.of(principal.getUsuario());
    }

    public static Usuario obrigatorio() {
        return atual().orElseThrow(() -> new IllegalStateException("Nenhum usuário autenticado na requisição"));
    }
}
