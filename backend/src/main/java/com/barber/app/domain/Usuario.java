package com.barber.app.domain;

import com.barber.app.domain.enums.TipoUsuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.regex.Pattern;

/**
 * Usuário base do sistema. A herança é JOINED: {@link Cliente} e {@link Barbeiro}
 * têm tabela própria ligada por FK a {@code usuario}. Um ADMIN é um Usuario "puro".
 */
@Entity
@Table(name = "usuario")
@Inheritance(strategy = InheritanceType.JOINED)
@Getter
@Setter
@NoArgsConstructor
public class Usuario {

    private static final Pattern EMAIL_VALIDO =
            Pattern.compile("^[\\w.+-]+@[\\w-]+\\.[\\w.-]{2,}$");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    /** Hash BCrypt — nunca a senha em texto puro. */
    @Column(nullable = false, length = 100)
    private String senha;

    @Column(length = 20)
    private String telefone;

    @Column(name = "foto_perfil", length = 500)
    private String fotoPerfil;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_usuario", nullable = false, length = 20)
    private TipoUsuario tipoUsuario;

    public Usuario(String nome, String email, String senha, String telefone, TipoUsuario tipoUsuario) {
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.telefone = telefone;
        this.tipoUsuario = tipoUsuario;
    }

    /** Atualiza os dados editáveis do perfil, ignorando valores nulos. */
    public void atualizarPerfil(String nome, String telefone, String fotoPerfil) {
        if (nome != null && !nome.isBlank()) {
            this.nome = nome;
        }
        if (telefone != null) {
            this.telefone = telefone;
        }
        if (fotoPerfil != null) {
            this.fotoPerfil = fotoPerfil;
        }
    }

    /** Troca o hash da senha. A validação da senha atual é feita no service. */
    public void alterarSenha(String novoHash) {
        this.senha = novoHash;
    }

    public static boolean validarEmail(String email) {
        return email != null && EMAIL_VALIDO.matcher(email).matches();
    }

    public boolean isAdmin() {
        return tipoUsuario == TipoUsuario.ADMIN;
    }
}
