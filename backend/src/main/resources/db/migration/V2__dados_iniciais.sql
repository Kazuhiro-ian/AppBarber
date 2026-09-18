-- =====================================================================
-- AppBarber — dados iniciais para desenvolvimento
-- Senhas (BCrypt): admin123 / barbeiro123 / cliente123
-- TROQUE ESTAS SENHAS ANTES DE IR PARA PRODUÇÃO.
-- =====================================================================

-- ------------------------- Usuários demo -----------------------------
INSERT INTO usuario (nome, email, senha, telefone, tipo_usuario) VALUES
    ('Administrador', 'admin@appbarber.com',   '$2a$10$sTYGI.hH7pzCqEfMrpbKUeK4LgMs.IqH1lVEM.EINIt5MjA4/8nhq', '(11) 90000-0000', 'ADMIN'),
    ('Carlos Tesoura', 'carlos@appbarber.com', '$2a$10$b2gOAWIW1/PhbMVa0UQdnut02KdhzmYJdldh9V30.S9EILs4bh1oO', '(11) 91111-1111', 'BARBEIRO'),
    ('Rafael Navalha', 'rafael@appbarber.com', '$2a$10$b2gOAWIW1/PhbMVa0UQdnut02KdhzmYJdldh9V30.S9EILs4bh1oO', '(11) 92222-2222', 'BARBEIRO'),
    ('João Cliente',   'joao@email.com',       '$2a$10$IHpeQ3yAsDjDbQT6pggUQuJqpZKTtIBH7J06FX/c0dM4Red7BSF8y', '(11) 93333-3333', 'CLIENTE');

INSERT INTO barbeiro (id, horario_inicio, horario_fim, comissao, ativo)
SELECT id, TIME '09:00', TIME '19:00', 40.00, TRUE FROM usuario WHERE email = 'carlos@appbarber.com';

INSERT INTO barbeiro (id, horario_inicio, horario_fim, comissao, ativo)
SELECT id, TIME '10:00', TIME '20:00', 35.00, TRUE FROM usuario WHERE email = 'rafael@appbarber.com';

INSERT INTO barbeiro_especialidade (barbeiro_id, especialidade)
SELECT id, e.especialidade FROM usuario, (VALUES ('Corte degradê'), ('Barba')) AS e(especialidade)
WHERE email = 'carlos@appbarber.com';

INSERT INTO barbeiro_especialidade (barbeiro_id, especialidade)
SELECT id, e.especialidade FROM usuario, (VALUES ('Navalhado'), ('Pigmentação')) AS e(especialidade)
WHERE email = 'rafael@appbarber.com';

INSERT INTO cliente (id, assinatura_id)
SELECT id, NULL FROM usuario WHERE email = 'joao@email.com';

-- --------------------------- Serviços --------------------------------
INSERT INTO servico (nome, categoria, duracao_minutos, preco, ativo) VALUES
    ('Corte masculino',   'Cabelo',   30, 45.00, TRUE),
    ('Corte degradê',     'Cabelo',   40, 55.00, TRUE),
    ('Barba completa',    'Barba',    30, 40.00, TRUE),
    ('Corte + Barba',     'Combo',    60, 80.00, TRUE),
    ('Pezinho',           'Cabelo',   15, 20.00, TRUE),
    ('Hidratação capilar','Tratamento', 45, 70.00, TRUE),
    ('Pigmentação',       'Tratamento', 30, 50.00, TRUE);

-- ------------------------- Planos / Assinaturas ----------------------
INSERT INTO assinatura (nome, preco, periodicidade, status) VALUES
    ('Plano Essencial', 89.90,  'MENSAL',     'ATIVA'),
    ('Plano Premium',   149.90, 'MENSAL',     'ATIVA'),
    ('Plano Anual VIP', 1290.00,'ANUAL',      'ATIVA');

INSERT INTO assinatura_beneficio (assinatura_id, beneficio)
SELECT id, b.beneficio FROM assinatura,
    (VALUES ('2 cortes por mês'), ('10% de desconto em produtos')) AS b(beneficio)
WHERE nome = 'Plano Essencial';

INSERT INTO assinatura_beneficio (assinatura_id, beneficio)
SELECT id, b.beneficio FROM assinatura,
    (VALUES ('4 cortes por mês'), ('Barba ilimitada'), ('20% de desconto em produtos')) AS b(beneficio)
WHERE nome = 'Plano Premium';

INSERT INTO assinatura_beneficio (assinatura_id, beneficio)
SELECT id, b.beneficio FROM assinatura,
    (VALUES ('Cortes ilimitados'), ('Barba ilimitada'), ('Horário prioritário'), ('30% de desconto em produtos')) AS b(beneficio)
WHERE nome = 'Plano Anual VIP';

-- ---------------------------- Estoque --------------------------------
INSERT INTO produto (nome, categoria, quantidade, quantidade_minima, preco_custo, preco_venda) VALUES
    ('Pomada modeladora 120g', 'Finalizador', 24, 10, 18.00, 39.90),
    ('Shampoo anticaspa 300ml','Higiene',     12,  6, 22.50, 49.90),
    ('Óleo para barba 30ml',   'Barba',        8,  10, 15.00, 35.00),
    ('Lâmina de barbear (cx)', 'Insumo',      40,  15,  9.90, 24.90),
    ('Talco pós-barba',        'Barba',        5,   8,  7.50, 19.90);

-- ---------------------------- Despesas -------------------------------
INSERT INTO despesa (categoria, valor, data, descricao) VALUES
    ('Aluguel',     2500.00, CURRENT_DATE - INTERVAL '10 day', 'Aluguel do ponto comercial'),
    ('Energia',      480.00, CURRENT_DATE - INTERVAL '8 day',  'Conta de luz'),
    ('Insumos',      950.00, CURRENT_DATE - INTERVAL '5 day',  'Reposição de produtos'),
    ('Marketing',    300.00, CURRENT_DATE - INTERVAL '2 day',  'Impulsionamento de posts');
