package com.barber.app.dto.despesa;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DespesaRequest(
        @NotBlank(message = "A categoria é obrigatória")
        @Size(max = 80, message = "A categoria deve ter no máximo {max} caracteres")
        String categoria,

        @NotNull(message = "O valor é obrigatório")
        @DecimalMin(value = "0.0", message = "O valor não pode ser negativo")
        @Digits(integer = 8, fraction = 2, message = "Valor inválido")
        BigDecimal valor,

        @NotNull(message = "A data é obrigatória")
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate data,

        @Size(max = 300, message = "A descrição deve ter no máximo {max} caracteres")
        String descricao,

        /** Opcional: vincula a despesa a um barbeiro (ex.: comissão, material de uso pessoal). */
        Long barbeiroId) {
}
