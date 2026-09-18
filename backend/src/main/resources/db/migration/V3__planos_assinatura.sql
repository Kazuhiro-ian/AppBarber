-- =====================================================================
-- AppBarber — catálogo de planos x assinaturas de clientes
--
-- A entidade Assinatura passa a cumprir dois papéis, distinguidos pela
-- coluna `modelo`:
--   * modelo = TRUE  -> plano do catálogo (o que o cliente vê e contrata)
--   * modelo = FALSE -> assinatura de um cliente (cópia do plano, com
--                       data_inicio, data_renovacao e status próprios)
-- Assim o cancelamento/renovação de um cliente nunca afeta o catálogo.
-- =====================================================================

ALTER TABLE assinatura ADD COLUMN modelo   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE assinatura ADD COLUMN ativo    BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE assinatura ADD COLUMN plano_id BIGINT;

ALTER TABLE assinatura
    ADD CONSTRAINT fk_assinatura_plano FOREIGN KEY (plano_id) REFERENCES assinatura (id);

-- As assinaturas criadas na carga inicial são, na verdade, o catálogo.
UPDATE assinatura SET modelo = TRUE WHERE data_inicio IS NULL;

CREATE INDEX idx_assinatura_modelo ON assinatura (modelo);

-- ---------------------------------------------------------------------
-- Um barbeiro não pode ter dois atendimentos confirmados no mesmo
-- horário. Trava no banco, além da verificação feita no service.
-- ---------------------------------------------------------------------
CREATE UNIQUE INDEX uk_agenda_barbeiro_confirmado
    ON agendamento (barbeiro_id, data, horario)
    WHERE status = 'CONFIRMADO';
