package com.barber.app.dto.auth;

import com.barber.app.domain.enums.TipoUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegistroRequest(
        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 120, message = "O nome deve ter no máximo {max} caracteres")
        String nome,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "E-mail inválido")
        @Size(max = 150, message = "O e-mail deve ter no máximo {max} caracteres")
        String email,

        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 6, max = 72, message = "A senha deve ter entre {min} e {max} caracteres")
        String senha,

        @Size(max = 20, message = "O telefone deve ter no máximo {max} caracteres")
        String telefone,

        /** Opcional: CLIENTE por padrão. Criar BARBEIRO/ADMIN exige um ADMIN autenticado. */
        TipoUsuario tipoUsuario) {
}
