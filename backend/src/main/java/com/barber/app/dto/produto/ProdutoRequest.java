package com.barber.app.dto.produto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProdutoRequest(
        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 120, message = "O nome deve ter no máximo {max} caracteres")
        String nome,

        @Size(max = 80, message = "A categoria deve ter no máximo {max} caracteres")
        String categoria,

        @Min(value = 0, message = "A quantidade não pode ser negativa")
        int quantidade,

        @Min(value = 0, message = "A quantidade mínima não pode ser negativa")
        int quantidadeMinima,

        @NotNull(message = "O preço de custo é obrigatório")
        @DecimalMin(value = "0.0", message = "O preço de custo não pode ser negativo")
        @Digits(integer = 8, fraction = 2, message = "Preço de custo inválido")
        BigDecimal precoCusto,

        @NotNull(message = "O preço de venda é obrigatório")
        @DecimalMin(value = "0.0", message = "O preço de venda não pode ser negativo")
        @Digits(integer = 8, fraction = 2, message = "Preço de venda inválido")
        BigDecimal precoVenda) {
}
