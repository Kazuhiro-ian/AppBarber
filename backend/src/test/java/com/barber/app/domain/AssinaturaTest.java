package com.barber.app.domain;

import com.barber.app.domain.enums.Periodicidade;
import com.barber.app.domain.enums.StatusAssinatura;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Assinatura")
class AssinaturaTest {

    @Test
    @DisplayName("contratar gera uma cópia do plano, já vigente, sem alterar o catálogo")
    void contratarGeraCopia() {
        Assinatura plano = plano();

        Assinatura contratada = plano.contratar();

        assertThat(contratada.isModelo()).isFalse();
        assertThat(contratada.getPlano()).isSameAs(plano);
        assertThat(contratada.getNome()).isEqualTo(plano.getNome());
        assertThat(contratada.getDataInicio()).isEqualTo(LocalDate.now());
        assertThat(contratada.getDataRenovacao()).isEqualTo(LocalDate.now().plusMonths(1));
        assertThat(contratada.getStatus()).isEqualTo(StatusAssinatura.ATIVA);

        // O catálogo continua sem vigência própria.
        assertThat(plano.getDataInicio()).isNull();
    }

    @Test
    @DisplayName("plano indisponível não pode ser contratado")
    void planoInativo() {
        Assinatura plano = plano();
        plano.setAtivo(false);

        assertThatThrownBy(plano::contratar)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("não está disponível");
    }

    @Test
    @DisplayName("renovar estende a vigência a partir da renovação atual")
    void renovar() {
        Assinatura contratada = plano().contratar();
        LocalDate renovacaoOriginal = contratada.getDataRenovacao();

        contratada.renovar();

        assertThat(contratada.getDataRenovacao()).isEqualTo(renovacaoOriginal.plusMonths(1));
    }

    @Test
    @DisplayName("assinatura cancelada não pode ser renovada nem é considerada vigente")
    void canceladaNaoRenova() {
        Assinatura contratada = plano().contratar();
        contratada.cancelar();

        assertThat(contratada.verificarValidade()).isFalse();
        assertThatThrownBy(contratada::renovar).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("vencida é marcada como expirada ao verificar a validade")
    void expira() {
        Assinatura contratada = plano().contratar();
        contratada.setDataRenovacao(LocalDate.now().minusDays(1));

        assertThat(contratada.verificarValidade()).isFalse();
        assertThat(contratada.getStatus()).isEqualTo(StatusAssinatura.EXPIRADA);
    }

    @Test
    @DisplayName("periodicidade define o intervalo de renovação")
    void periodicidade() {
        LocalDate base = LocalDate.of(2026, 1, 31);

        assertThat(Periodicidade.MENSAL.proximaRenovacao(base)).isEqualTo(LocalDate.of(2026, 2, 28));
        assertThat(Periodicidade.TRIMESTRAL.proximaRenovacao(base)).isEqualTo(LocalDate.of(2026, 4, 30));
        assertThat(Periodicidade.ANUAL.proximaRenovacao(base)).isEqualTo(LocalDate.of(2027, 1, 31));
    }

    @Test
    @DisplayName("cliente reflete a assinatura vigente")
    void clienteComAssinatura() {
        Cliente cliente = new Cliente("Joao", "joao@email.com", "hash", null);
        assertThat(cliente.possuiAssinaturaVigente()).isFalse();

        cliente.assinarPlano(plano().contratar());
        assertThat(cliente.possuiAssinaturaVigente()).isTrue();

        cliente.cancelarAssinatura();
        assertThat(cliente.possuiAssinaturaVigente()).isFalse();
    }

    private Assinatura plano() {
        return Assinatura.novoPlano(
                "Plano Premium",
                List.of("4 cortes por mês", "Barba ilimitada"),
                new BigDecimal("149.90"),
                Periodicidade.MENSAL);
    }
}
