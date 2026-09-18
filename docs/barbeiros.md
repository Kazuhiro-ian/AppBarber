# Módulo: Barbeiros

Equipe da barbearia: cadastro, perfil profissional, painel do dia e comissões.

**Backend:** `BarbeiroController`, `BarbeiroService`, `Barbeiro`, `BarbeiroRepository`
**Frontend:** `pages/barbeiro/PainelBarbeiro.jsx`, `pages/barbeiro/PerfilBarbeiro.jsx`,
`pages/admin/GestaoBarbeiros.jsx`

---

## Funcionalidades

### 1. Vitrine para o cliente

`GET /api/barbeiros` devolve apenas barbeiros **ativos**, em uma visão pública:
nome, foto, especialidades e jornada. **Não** expõe e-mail, telefone nem comissão —
esses campos só aparecem para o próprio barbeiro e para o ADMIN.

### 2. Cadastro de barbeiro (ADMIN)

Um único endpoint cria o usuário e o perfil profissional:

- nome, e-mail de acesso e senha provisória (hash BCrypt);
- telefone (opcional);
- jornada de trabalho (`horarioInicio` / `horarioFim`);
- percentual de comissão (0 a 100);
- lista de especialidades (normalizada: sem vazios, sem duplicatas, com `trim`).

E-mail duplicado devolve 400. O barbeiro nasce **ativo**.

### 3. Perfil profissional

Quem edita o quê:

| Campo | Barbeiro | Admin |
|---|:--:|:--:|
| Especialidades | ✅ | ✅ |
| Jornada (`horarioInicio`/`horarioFim`) | ✅ | ✅ |
| Percentual de comissão | ❌ (403) | ✅ |
| Ativo / inativo | ❌ (403) | ✅ |
| Nome, telefone, foto | ✅ (via `/api/auth/perfil`) | — |

A jornada é validada no domínio: início precisa ser anterior ao fim, senão
`IllegalArgumentException` → HTTP 400.

### 4. Ativar / inativar

Barbeiro inativo:

- some da lista de escolha do cliente;
- não oferece horários na grade de disponibilidade;
- não recebe novos agendamentos;
- **mantém** todo o histórico de atendimentos e continua aparecendo nos relatórios.

Não existe exclusão física de barbeiro — isso quebraria o histórico de agendamentos.

### 5. Painel do barbeiro

`GET /api/barbeiros/painel` entrega tudo o que a tela inicial precisa em uma chamada:

| Indicador | Cálculo |
|---|---|
| Atendimentos hoje | agendamentos do dia que não estão cancelados |
| Concluídos hoje | status `CONCLUIDO` |
| Pendentes hoje | status `CONFIRMADO` |
| Faturamento do dia | soma dos serviços concluídos hoje |
| Comissão do dia | faturamento do dia × percentual |
| Faturamento do mês | soma dos concluídos no mês corrente |
| Comissão do mês | faturamento do mês × percentual |
| Próximo atendimento | primeiro confirmado ainda não vencido |
| Agenda do dia | lista completa do dia |

### 6. Agenda do dia com totalizadores

`GET /api/barbeiros/agenda` devolve a lista do dia **e** os totais do cabeçalho:
confirmados, concluídos, cancelados, faturamento previsto (confirmados +
concluídos), faturamento realizado (só concluídos) e comissão prevista.

### 7. Comissões

`GET /api/barbeiros/comissao` calcula, para um período (padrão: mês corrente):

```
comissão = Σ (preço dos serviços CONCLUIDOS no período) × percentual ÷ 100
```

Arredondamento `HALF_UP` com 2 casas. Atendimentos confirmados ou cancelados
**não** entram. O barbeiro consulta a própria comissão; o ADMIN consulta a de
qualquer um (`barbeiroId`).

---

## Endpoints

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/api/barbeiros` | autenticado | Barbeiros ativos (visão pública) |
| `GET` | `/api/barbeiros/gerenciar` | ADMIN | Todos, com contato e comissão |
| `GET` | `/api/barbeiros/{id}` | autenticado | Detalhe (campos sensíveis só para dono/ADMIN) |
| `GET` | `/api/barbeiros/eu` | BARBEIRO | Próprio perfil profissional |
| `PUT` | `/api/barbeiros/eu` | BARBEIRO | Edita jornada e especialidades |
| `GET` | `/api/barbeiros/painel?barbeiroId&data` | BARBEIRO, ADMIN | Visão geral do dia |
| `GET` | `/api/barbeiros/agenda?barbeiroId&data` | BARBEIRO, ADMIN | Agenda + totalizadores |
| `GET` | `/api/barbeiros/comissao?barbeiroId&inicio&fim` | BARBEIRO, ADMIN | Comissão do período |
| `POST` | `/api/barbeiros` | ADMIN | Cadastra barbeiro (201) |
| `PUT` | `/api/barbeiros/{id}` | ADMIN | Edita jornada, especialidades, comissão, status |
| `PATCH` | `/api/barbeiros/{id}/status?ativo=` | ADMIN | Ativa / inativa |

> Nos endpoints com `barbeiroId` opcional, omitir o parâmetro significa "o barbeiro
> logado". Informar o id de **outro** barbeiro exige perfil ADMIN — caso contrário, 403.

### Exemplo — comissão do mês

```bash
curl "http://localhost:8080/api/barbeiros/comissao?inicio=2026-09-01&fim=2026-09-30" \
  -H "Authorization: Bearer $TOKEN_BARBEIRO"
```

```json
{
  "barbeiroId": 2,
  "barbeiroNome": "Carlos Tesoura",
  "periodoInicio": "2026-09-01",
  "periodoFim": "2026-09-30",
  "atendimentosConcluidos": 2,
  "faturamento": 80.00,
  "percentualComissao": 40.00,
  "valorComissao": 32.00
}
```

---

## Validações

| Campo | Regra |
|---|---|
| `nome` | obrigatório, até 120 caracteres |
| `email` | obrigatório, formato válido, único |
| `senha` | obrigatória no cadastro, de 6 a 72 caracteres |
| `comissao` | de 0 a 100 |
| `horarioInicio` / `horarioFim` | início anterior ao fim |
| `especialidades` | até 20 itens, cada um com até 80 caracteres |

---

## Telas

### Painel do barbeiro (`/barbeiro`)

Saudação com o primeiro nome, data por extenso, quatro indicadores (atendimentos,
concluídos, faturamento do dia com comissão, faturamento do mês com comissão),
cartão do **próximo cliente** (com telefone) e a agenda resumida do dia.

### Perfil profissional (`/barbeiro/perfil`)

- Situação (ativo/inativo), percentual de comissão e jornada em destaque.
- Formulário de jornada + gerenciamento de especialidades (adicionar com Enter,
  remover clicando no chip).
- Bloco de comissão por período, com seletor de datas.
- Link para os dados da conta (`/perfil`).

### Barbeiros (`/admin/barbeiros`)

Cartões com avatar, contato, jornada, comissão e especialidades. Ações: **Editar**
(jornada e comissão), **Comissão do mês** (modal com atendimentos, faturamento e
valor a pagar) e **Inativar / Reativar**. Botão **Novo barbeiro** abre o formulário
completo de cadastro.
