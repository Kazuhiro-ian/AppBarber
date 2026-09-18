package com.barber.app.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Origens liberadas para o frontend (prefixo {@code app.cors}). */
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(List<String> allowedOrigins) {
}
