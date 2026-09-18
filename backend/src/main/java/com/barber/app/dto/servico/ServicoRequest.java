package com.barber.app.dto.servico;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ServicoRequest(
        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 120, message = "O nome deve ter no máximo {max} caracteres")
        String nome,

        @Size(max = 80, message = "A categoria deve ter no máximo {max} caracteres")
        String categoria,

        @Min(value = 5, message = "A duração mínima é de {value} minutos")
        @Max(value = 480, message = "A duração máxima é de {value} minutos")
        int duracaoMinutos,

        @NotNull(message = "O preço é obrigatório")
        @DecimalMin(value = "0.0", message = "O preço não pode ser negativo")
        @Digits(integer = 8, fraction = 2, message = "Preço inválido")
        BigDecimal preco,

        Boolean ativo) {
}
