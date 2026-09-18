package com.barber.app.domain.enums;

import java.time.LocalDate;

public enum Periodicidade {
    MENSAL(1),
    TRIMESTRAL(3),
    ANUAL(12);

    private final int meses;

    Periodicidade(int meses) {
        this.meses = meses;
    }

    public int getMeses() {
        return meses;
    }

    /** Data da próxima renovação a partir de uma data base. */
    public LocalDate proximaRenovacao(LocalDate base) {
        return base.plusMonths(meses);
    }
}
