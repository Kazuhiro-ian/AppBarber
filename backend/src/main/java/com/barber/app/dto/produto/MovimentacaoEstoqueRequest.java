package com.barber.app.dto.produto;

import jakarta.validation.constraints.Min;

/** Entrada ou saída de estoque de um produto. */
public record MovimentacaoEstoqueRequest(
        @Min(value = 1, message = "A quantidade deve ser de pelo menos {value}")
        int quantidade) {
}
