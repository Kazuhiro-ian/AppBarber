package com.barber.app.dto.auth;

import com.barber.app.domain.Usuario;
import com.barber.app.domain.enums.TipoUsuario;

public record UsuarioResponse(
        Long id,
        String nome,
        String email,
        String telefone,
        String fotoPerfil,
        TipoUsuario tipoUsuario) {

    public static UsuarioResponse de(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTelefone(),
                usuario.getFotoPerfil(),
                usuario.getTipoUsuario());
    }
}
