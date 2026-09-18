package com.barber.app.dto.barbeiro;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

/** Cadastro de barbeiro feito pelo ADMIN (cria o usuário e o perfil profissional). */
public record NovoBarbeiroRequest(
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

        List<String> especialidades,

        @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
        LocalTime horarioInicio,

        @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
        LocalTime horarioFim,

        @DecimalMin(value = "0.0", message = "A comissão não pode ser negativa")
        @DecimalMax(value = "100.0", message = "A comissão não pode passar de {value}%")
        BigDecimal comissao) {
}
