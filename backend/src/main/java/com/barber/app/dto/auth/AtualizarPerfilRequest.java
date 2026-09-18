package com.barber.app.dto.auth;

import jakarta.validation.constraints.Size;

public record AtualizarPerfilRequest(
        @Size(max = 120, message = "O nome deve ter no máximo {max} caracteres")
        String nome,

        @Size(max = 20, message = "O telefone deve ter no máximo {max} caracteres")
        String telefone,

        @Size(max = 500, message = "A URL da foto deve ter no máximo {max} caracteres")
        String fotoPerfil) {
}
