# Modelagem do domínio

Visão geral das entidades, relações e do esquema de banco. Os nomes seguem o
planejamento original: português, `camelCase` no Java e `snake_case` no banco.

---

## Diagrama de relações

```
                   ┌───────────────┐
                   │    Usuario    │  (herança JOINED)
                   │  id, nome,    │
                   │  email, senha │
                   │  tipoUsuario  │
                   └───────┬───────┘
                ┌──────────┴──────────┐
                │                     │
        ┌───────▼───────┐     ┌───────▼────────┐
        │    Cliente    │     │    Barbeiro    │
        │ assinaturaAtiva│    │ especialidades │
        └───────┬───────┘     │ horarioInicio  │
                │             │ horarioFim     │
                │             │ comissao,ativo │
                │             └───┬────────┬───┘
                │ 0..*            │ 0..*   │ 0..*
                │                 │        │
            ┌───▼─────────────────▼──┐  ┌──▼──────┐   ┌─────────┐
            │      Agendamento       │  │ Despesa │   │ Produto │
            │ data, horario, status  │  └─────────┘   └────┬────┘
            └───────────┬────────────┘                     │ 0..*
                        │ 0..*                             │ (N:N com Barbeiro)
                  ┌─────▼─────┐                            │
                  │  Servico  │                            │
                  └───────────┘                            │
                                                           │
        ┌────────────┐                                     │
        │ Assinatura │◄── Cliente 1 → 0..1                  │
        └────────────┘                                     │
                                                           │
        GestaoFinanceira (serviço, não é entidade) ────► agrega
        Agendamento (receita) + Despesa (gastos) por período
```

### Cardinalidades

| Relação | Cardinalidade |
|---|---|
| `Usuario` → `Cliente` / `Barbeiro` | herança JOINED (um ADMIN é um `Usuario` "puro") |
| `Cliente` → `Agendamento` | 1 → 0..* |
| `Barbeiro` → `Agendamento` | 1 → 0..* |
| `Agendamento` → `Servico` | 0..* → 1 |
| `Cliente` → `Assinatura` | 1 → 0..1 |
| `Barbeiro` → `Despesa` | 1 → 0..* (opcional) |
| `Barbeiro` ↔ `Produto` | 0..* ↔ 0..* (consumo/uso de estoque) |

---

## Entidades

### Usuario (`usuario`)

Classe base. A herança é **JOINED**: `cliente` e `barbeiro` têm tabela própria
ligada por FK à `usuario`.

| Atributo | Tipo Java | Coluna | Observação |
|---|---|---|---|
| `id` | `Long` | `id` | `BIGSERIAL` |
| `nome` | `String` | `nome` | obrigatório, até 120 caracteres |
| `email` | `String` | `email` | **único**, até 150 |
| `senha` | `String` | `senha` | hash **BCrypt**, nunca texto puro |
| `telefone` | `String` | `telefone` | opcional |
| `fotoPerfil` | `String` | `foto_perfil` | URL, opcional |
| `tipoUsuario` | `TipoUsuario` | `tipo_usuario` | `CLIENTE` / `BARBEIRO` / `ADMIN` |

**Métodos de domínio:** `atualizarPerfil()`, `alterarSenha()`, `validarEmail()` (estático),
`isAdmin()`. O login/autenticação fica em `AuthService` + `JwtService`, para manter
o domínio livre de dependências do Spring Security.

### Cliente (`cliente`)

| Atributo | Tipo | Observação |
|---|---|---|
| `historicoAgendamentos` | `List<Agendamento>` | relação `@OneToMany`, não é coluna |
| `assinaturaAtiva` | `Assinatura` | FK `assinatura_id`, nullable |

**Métodos:** `assinarPlano()`, `cancelarAssinatura()`, `possuiAssinaturaVigente()`.

### Barbeiro (`barbeiro`)

| Atributo | Tipo | Coluna | Observação |
|---|---|---|---|
| `especialidades` | `List<String>` | tabela `barbeiro_especialidade` | `@ElementCollection` |
| `horarioInicio` | `LocalTime` | `horario_inicio` | início da jornada |
| `horarioFim` | `LocalTime` | `horario_fim` | fim da jornada |
| `comissao` | `BigDecimal` | `comissao` | percentual, 0 a 100 |
| `ativo` | `boolean` | `ativo` | inativo some da lista de agendamento |

**Métodos:** `definirHorarioTrabalho()`, `atendeNoHorario()`, `calcularComissao()`.

### Agendamento (`agendamento`)

| Atributo | Tipo | Coluna |
|---|---|---|
| `cliente` | `Cliente` | `cliente_id` |
| `barbeiro` | `Barbeiro` | `barbeiro_id` |
| `servico` | `Servico` | `servico_id` |
| `data` | `LocalDate` | `data` |
| `horario` | `LocalTime` | `horario` |
| `status` | `StatusAgendamento` | `CONFIRMADO` / `CONCLUIDO` / `CANCELADO` |
| `dataCriacao` | `LocalDateTime` | preenchida em `@PrePersist` |

**Métodos:** `confirmar()`, `cancelar()`, `concluir()`, `remarcar()`, `horarioFim()`,
`conflitaCom()`, `calcularValorTotal()`.

> Todas as transições exigem que o agendamento esteja `CONFIRMADO`; caso contrário
> lançam `IllegalStateException`, que o handler global converte em HTTP 400.

### Servico (`servico`)

| Atributo | Tipo | Observação |
|---|---|---|
| `nome`, `categoria` | `String` | categoria agrupa na vitrine |
| `duracaoMinutos` | `int` | define o bloqueio na agenda |
| `preco` | `BigDecimal` | base da receita e da comissão |
| `ativo` | `boolean` | exclusão é lógica |

### Assinatura (`assinatura`)

Cumpre **dois papéis**, distinguidos pela coluna `modelo`:

- `modelo = true` → **plano do catálogo**, mantido pelo ADMIN;
- `modelo = false` → **assinatura de um cliente**, cópia do plano com vigência própria.

| Atributo | Tipo | Observação |
|---|---|---|
| `nome` | `String` | |
| `beneficios` | `List<String>` | tabela `assinatura_beneficio` |
| `preco` | `BigDecimal` | |
| `periodicidade` | `Periodicidade` | `MENSAL` / `TRIMESTRAL` / `ANUAL` |
| `dataInicio`, `dataRenovacao` | `LocalDate` | só na assinatura do cliente |
| `status` | `StatusAssinatura` | `ATIVA` / `CANCELADA` / `EXPIRADA` |
| `modelo` | `boolean` | catálogo x assinatura |
| `ativo` | `boolean` | disponível para contratação (só no catálogo) |
| `plano` | `Assinatura` | FK `plano_id` para o plano de origem |

**Métodos:** `novoPlano()`, `contratar()`, `ativar()`, `cancelar()`, `renovar()`,
`verificarValidade()`, `diasParaRenovacao()`.

### Produto (`produto`)

| Atributo | Tipo | Observação |
|---|---|---|
| `nome`, `categoria` | `String` | |
| `quantidade` | `int` | estoque atual |
| `quantidadeMinima` | `int` | dispara o alerta de reposição |
| `precoCusto`, `precoVenda` | `BigDecimal` | |

**Métodos:** `darBaixaEstoque()`, `repor()`, `verificarEstoqueMinimo()`, `margemUnitaria()`.

### Despesa (`despesa`)

| Atributo | Tipo | Observação |
|---|---|---|
| `categoria` | `String` | agrupamento do relatório |
| `valor` | `BigDecimal` | |
| `data` | `LocalDate` | define em qual período entra |
| `descricao` | `String` | opcional |
| `barbeiro` | `Barbeiro` | FK opcional |

### GestaoFinanceira

**Não é entidade persistida.** É o serviço `GestaoFinanceiraService`, que cruza
`Agendamento` (receita) e `Despesa` (gastos) por período e devolve DTOs:
`ResumoFinanceiroResponse`, `RelatorioFinanceiroResponse`,
`ComparativoPeriodosResponse` e `ResumoDashboardResponse`.

---

## Migrations

| Versão | Arquivo | O que faz |
|---|---|---|
| V1 | `V1__schema_inicial.sql` | Cria todas as tabelas, FKs, índices e *checks* |
| V2 | `V2__dados_iniciais.sql` | Carga de demonstração: usuários, serviços, planos, produtos e despesas |
| V3 | `V3__planos_assinatura.sql` | Colunas `modelo`, `ativo` e `plano_id` em `assinatura`; índice único que impede dois atendimentos confirmados no mesmo horário do mesmo barbeiro |

O Hibernate roda com `ddl-auto: validate`: **quem cria o schema é o Flyway**, o
Hibernate apenas confere se o mapeamento bate com o banco. Qualquer mudança de
entidade precisa de uma migration nova.

### Garantias no nível do banco

- `uk_usuario_email` — e-mail único
- `uk_agenda_barbeiro_confirmado` — índice único parcial em
  `(barbeiro_id, data, horario) WHERE status = 'CONFIRMADO'`: mesmo com duas
  requisições simultâneas, só uma reserva o horário
- *Checks* de domínio nos enums, preços não negativos, quantidade de estoque ≥ 0
  e comissão entre 0 e 100
