package com.barber.app.dto.barbeiro;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

/**
 * Dados profissionais do barbeiro. A comissão só é aplicada quando quem
 * edita é um ADMIN — o próprio barbeiro não altera o próprio percentual.
 */
public record BarbeiroPerfilRequest(
        @Size(max = 20, message = "Informe no máximo {max} especialidades")
        List<@Size(max = 80, message = "Especialidade muito longa") String> especialidades,

        @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
        LocalTime horarioInicio,

        @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
        LocalTime horarioFim,

        @DecimalMin(value = "0.0", message = "A comissão não pode ser negativa")
        @DecimalMax(value = "100.0", message = "A comissão não pode passar de {value}%")
        BigDecimal comissao,

        Boolean ativo) {
}
