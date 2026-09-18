package com.barber.app.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configurações do token JWT (prefixo {@code app.jwt} em application.yml).
 *
 * @param secret     chave HMAC — mínimo 32 caracteres. Em produção, venha de variável de ambiente.
 * @param expiracaoMs validade do token em milissegundos
 * @param emissor    identificador do emissor gravado no claim {@code iss}
 */
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(String secret, long expiracaoMs, String emissor) {
}
