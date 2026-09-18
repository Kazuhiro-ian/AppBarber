package com.barber.app.dto.assinatura;

import com.barber.app.domain.enums.Periodicidade;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/** Plano do catálogo, mantido pelo ADMIN. */
public record PlanoRequest(
        @NotBlank(message = "O nome do plano é obrigatório")
        @Size(max = 120, message = "O nome deve ter no máximo {max} caracteres")
        String nome,

        @Size(max = 15, message = "Informe no máximo {max} benefícios")
        List<@Size(max = 200, message = "Benefício muito longo") String> beneficios,

        @NotNull(message = "O preço é obrigatório")
        @DecimalMin(value = "0.0", message = "O preço não pode ser negativo")
        @Digits(integer = 8, fraction = 2, message = "Preço inválido")
        BigDecimal preco,

        @NotNull(message = "A periodicidade é obrigatória")
        Periodicidade periodicidade,

        Boolean ativo) {
}
