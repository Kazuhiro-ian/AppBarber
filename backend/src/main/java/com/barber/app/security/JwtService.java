package com.barber.app.security;

import com.barber.app.config.JwtProperties;
import com.barber.app.domain.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtService {

    private final JwtProperties propriedades;
    private final SecretKey chave;

    public JwtService(JwtProperties propriedades) {
        this.propriedades = propriedades;
        byte[] bytes = propriedades.secret().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException(
                    "app.jwt.secret precisa ter no mínimo 32 caracteres para HMAC-SHA256");
        }
        this.chave = Keys.hmacShaKeyFor(bytes);
    }

    public String gerarToken(Usuario usuario) {
        Instant agora = Instant.now();
        Instant expiracao = agora.plusMillis(propriedades.expiracaoMs());
        return Jwts.builder()
                .subject(usuario.getEmail())
                .issuer(propriedades.emissor())
                .claim("id", usuario.getId())
                .claim("nome", usuario.getNome())
                .claim("tipoUsuario", usuario.getTipoUsuario().name())
                .issuedAt(Date.from(agora))
                .expiration(Date.from(expiracao))
                .signWith(chave)
                .compact();
    }

    /** E-mail (subject) do token, ou vazio se o token for inválido/expirado. */
    public Optional<String> extrairEmail(String token) {
        return extrairClaims(token).map(Claims::getSubject);
    }

    public Optional<Claims> extrairClaims(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(chave)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(claims);
        } catch (JwtException | IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    public long expiracaoEmSegundos() {
        return propriedades.expiracaoMs() / 1000;
    }
}
