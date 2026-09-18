package com.barber.app.domain;

import com.barber.app.domain.enums.TipoUsuario;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cliente")
@PrimaryKeyJoinColumn(name = "id")
@Getter
@Setter
@NoArgsConstructor
public class Cliente extends Usuario {

    @OneToMany(mappedBy = "cliente", fetch = FetchType.LAZY)
    private List<Agendamento> historicoAgendamentos = new ArrayList<>();

    /** Assinatura vigente do cliente (0..1). */
    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    @JoinColumn(name = "assinatura_id")
    private Assinatura assinaturaAtiva;

    public Cliente(String nome, String email, String senha, String telefone) {
        super(nome, email, senha, telefone, TipoUsuario.CLIENTE);
    }

    public void assinarPlano(Assinatura assinatura) {
        assinatura.ativar();
        this.assinaturaAtiva = assinatura;
    }

    public void cancelarAssinatura() {
        if (assinaturaAtiva != null) {
            assinaturaAtiva.cancelar();
        }
    }

    public boolean possuiAssinaturaVigente() {
        return assinaturaAtiva != null && assinaturaAtiva.verificarValidade();
    }
}
