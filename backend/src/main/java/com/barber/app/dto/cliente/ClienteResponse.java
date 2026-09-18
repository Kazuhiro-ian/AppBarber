package com.barber.app.dto.cliente;

import com.barber.app.domain.Cliente;
import com.barber.app.dto.assinatura.AssinaturaResponse;

/** Cliente na visão do ADMIN, já com a assinatura vigente (se houver). */
public record ClienteResponse(
        Long id,
        String nome,
        String email,
        String telefone,
        String fotoPerfil,
        AssinaturaResponse assinatura) {

    public static ClienteResponse de(Cliente cliente) {
        return new ClienteResponse(
                cliente.getId(),
                cliente.getNome(),
                cliente.getEmail(),
                cliente.getTelefone(),
                cliente.getFotoPerfil(),
                cliente.getAssinaturaAtiva() != null
                        ? AssinaturaResponse.de(cliente.getAssinaturaAtiva())
                        : null);
    }
}
