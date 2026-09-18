-- =====================================================================
-- AppBarber — schema inicial
-- Reflete a modelagem de classes: Usuario (herança JOINED para Cliente e
-- Barbeiro), Servico, Agendamento, Assinatura, Produto e Despesa.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Assinatura (criada antes de cliente por causa da FK assinatura_id)
-- ---------------------------------------------------------------------
CREATE TABLE assinatura (
    id              BIGSERIAL      PRIMARY KEY,
    nome            VARCHAR(120)   NOT NULL,
    preco           NUMERIC(10, 2) NOT NULL,
    periodicidade   VARCHAR(20)    NOT NULL,
    data_inicio     DATE,
    data_renovacao  DATE,
    status          VARCHAR(20)    NOT NULL,
    CONSTRAINT ck_assinatura_periodicidade CHECK (periodicidade IN ('MENSAL', 'TRIMESTRAL', 'ANUAL')),
    CONSTRAINT ck_assinatura_status        CHECK (status IN ('ATIVA', 'CANCELADA', 'EXPIRADA')),
    CONSTRAINT ck_assinatura_preco         CHECK (preco >= 0)
);

CREATE TABLE assinatura_beneficio (
    assinatura_id BIGINT       NOT NULL,
    beneficio     VARCHAR(200) NOT NULL,
    CONSTRAINT fk_beneficio_assinatura FOREIGN KEY (assinatura_id) REFERENCES assinatura (id) ON DELETE CASCADE
);

CREATE INDEX idx_beneficio_assinatura ON assinatura_beneficio (assinatura_id);

-- ---------------------------------------------------------------------
-- Usuario e especializações (herança JOINED)
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
    id           BIGSERIAL    PRIMARY KEY,
    nome         VARCHAR(120) NOT NULL,
    email        VARCHAR(150) NOT NULL,
    senha        VARCHAR(100) NOT NULL,
    telefone     VARCHAR(20),
    foto_perfil  VARCHAR(500),
    tipo_usuario VARCHAR(20)  NOT NULL,
    CONSTRAINT uk_usuario_email    UNIQUE (email),
    CONSTRAINT ck_usuario_tipo     CHECK (tipo_usuario IN ('CLIENTE', 'BARBEIRO', 'ADMIN'))
);

CREATE TABLE cliente (
    id            BIGINT PRIMARY KEY,
    assinatura_id BIGINT,
    CONSTRAINT fk_cliente_usuario    FOREIGN KEY (id) REFERENCES usuario (id) ON DELETE CASCADE,
    CONSTRAINT fk_cliente_assinatura FOREIGN KEY (assinatura_id) REFERENCES assinatura (id)
);

CREATE TABLE barbeiro (
    id             BIGINT        PRIMARY KEY,
    horario_inicio TIME,
    horario_fim    TIME,
    comissao       NUMERIC(5, 2) DEFAULT 0,
    ativo          BOOLEAN       NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_barbeiro_usuario FOREIGN KEY (id) REFERENCES usuario (id) ON DELETE CASCADE,
    CONSTRAINT ck_barbeiro_comissao CHECK (comissao >= 0 AND comissao <= 100)
);

CREATE TABLE barbeiro_especialidade (
    barbeiro_id  BIGINT      NOT NULL,
    especialidade VARCHAR(80) NOT NULL,
    CONSTRAINT fk_especialidade_barbeiro FOREIGN KEY (barbeiro_id) REFERENCES barbeiro (id) ON DELETE CASCADE
);

CREATE INDEX idx_especialidade_barbeiro ON barbeiro_especialidade (barbeiro_id);

-- ---------------------------------------------------------------------
-- Serviços
-- ---------------------------------------------------------------------
CREATE TABLE servico (
    id              BIGSERIAL      PRIMARY KEY,
    nome            VARCHAR(120)   NOT NULL,
    categoria       VARCHAR(80),
    duracao_minutos INTEGER        NOT NULL,
    preco           NUMERIC(10, 2) NOT NULL,
    ativo           BOOLEAN        NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_servico_duracao CHECK (duracao_minutos > 0),
    CONSTRAINT ck_servico_preco   CHECK (preco >= 0)
);

CREATE INDEX idx_servico_categoria ON servico (categoria);

-- ---------------------------------------------------------------------
-- Agendamentos
-- ---------------------------------------------------------------------
CREATE TABLE agendamento (
    id           BIGSERIAL   PRIMARY KEY,
    cliente_id   BIGINT      NOT NULL,
    barbeiro_id  BIGINT      NOT NULL,
    servico_id   BIGINT      NOT NULL,
    data         DATE        NOT NULL,
    horario      TIME        NOT NULL,
    status       VARCHAR(20) NOT NULL,
    data_criacao TIMESTAMP   NOT NULL,
    CONSTRAINT fk_agendamento_cliente  FOREIGN KEY (cliente_id) REFERENCES cliente (id),
    CONSTRAINT fk_agendamento_barbeiro FOREIGN KEY (barbeiro_id) REFERENCES barbeiro (id),
    CONSTRAINT fk_agendamento_servico  FOREIGN KEY (servico_id) REFERENCES servico (id),
    CONSTRAINT ck_agendamento_status   CHECK (status IN ('CONFIRMADO', 'CONCLUIDO', 'CANCELADO'))
);

CREATE INDEX idx_agendamento_cliente       ON agendamento (cliente_id);
CREATE INDEX idx_agendamento_barbeiro_data ON agendamento (barbeiro_id, data);
CREATE INDEX idx_agendamento_data_status   ON agendamento (data, status);

-- ---------------------------------------------------------------------
-- Estoque
-- ---------------------------------------------------------------------
CREATE TABLE produto (
    id                BIGSERIAL      PRIMARY KEY,
    nome              VARCHAR(120)   NOT NULL,
    categoria         VARCHAR(80),
    quantidade        INTEGER        NOT NULL DEFAULT 0,
    quantidade_minima INTEGER        NOT NULL DEFAULT 0,
    preco_custo       NUMERIC(10, 2) NOT NULL,
    preco_venda       NUMERIC(10, 2) NOT NULL,
    CONSTRAINT ck_produto_quantidade     CHECK (quantidade >= 0),
    CONSTRAINT ck_produto_qtd_minima     CHECK (quantidade_minima >= 0),
    CONSTRAINT ck_produto_precos         CHECK (preco_custo >= 0 AND preco_venda >= 0)
);

CREATE INDEX idx_produto_nome ON produto (nome);

-- Consumo/uso de produtos pelos barbeiros (N:N)
CREATE TABLE barbeiro_produto (
    barbeiro_id BIGINT NOT NULL,
    produto_id  BIGINT NOT NULL,
    CONSTRAINT pk_barbeiro_produto PRIMARY KEY (barbeiro_id, produto_id),
    CONSTRAINT fk_bp_barbeiro FOREIGN KEY (barbeiro_id) REFERENCES barbeiro (id) ON DELETE CASCADE,
    CONSTRAINT fk_bp_produto  FOREIGN KEY (produto_id)  REFERENCES produto (id)  ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- Despesas (base da Gestão Financeira, junto com os agendamentos)
-- ---------------------------------------------------------------------
CREATE TABLE despesa (
    id          BIGSERIAL      PRIMARY KEY,
    categoria   VARCHAR(80)    NOT NULL,
    valor       NUMERIC(10, 2) NOT NULL,
    data        DATE           NOT NULL,
    descricao   VARCHAR(300),
    barbeiro_id BIGINT,
    CONSTRAINT fk_despesa_barbeiro FOREIGN KEY (barbeiro_id) REFERENCES barbeiro (id) ON DELETE SET NULL,
    CONSTRAINT ck_despesa_valor    CHECK (valor >= 0)
);

CREATE INDEX idx_despesa_data ON despesa (data);
