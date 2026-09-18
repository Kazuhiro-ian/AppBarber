# Módulo: Agendamentos

Coração do sistema: consulta de disponibilidade, criação, remarcação, cancelamento
e conclusão de atendimentos.

**Backend:** `AgendamentoController`, `AgendamentoService`, `Agendamento`,
`AgendamentoRepository`
**Frontend:** `pages/cliente/AgendarHorario.jsx`, `pages/cliente/MeusAgendamentos.jsx`,
`pages/barbeiro/AgendaDia.jsx`, `pages/admin/AgendaGeral.jsx`

---

## Funcionalidades

### 1. Consulta de disponibilidade

O cliente escolhe **serviço → barbeiro → data** e o backend devolve a grade de
horários livres já pronta para a tela.

Como a grade é montada:

1. Ponto de partida: a jornada do barbeiro (`horarioInicio` / `horarioFim`).
   Sem jornada configurada, assume 09:00–19:00.
2. A grade avança em passos de **15 minutos** (`AgendamentoService.INTERVALO_GRADE_MINUTOS`).
3. Um horário só entra se o atendimento inteiro couber antes do fim da jornada —
   um serviço de 30 min com jornada até 18:00 tem 17:30 como último horário.
4. Horários que se sobrepõem a atendimentos **CONFIRMADOS** do barbeiro são descartados,
   considerando a duração de cada um (um corte de 40 min às 10:00 bloqueia 09:30, 09:45,
   10:00, 10:15 e 10:30).
5. Datas passadas devolvem grade vazia; no dia corrente, horários já vencidos somem.
6. Barbeiro inativo não oferece horários.

A resposta traz também `horariosOcupados`, que a tela mostra como "já reservados".

### 2. Criar agendamento

Validações aplicadas em sequência:

| Regra | Erro |
|---|---|
| Barbeiro precisa estar ativo | 400 — "não está atendendo no momento" |
| Serviço precisa estar ativo | 400 — "não está disponível" |
| Data/hora não pode estar no passado | 400 — "data/hora no passado" |
| Horário precisa caber na jornada do barbeiro | 400 — "fora da jornada de …" |
| Barbeiro não pode ter outro atendimento sobreposto | 400 — "já tem atendimento marcado nesse horário" |
| Cliente não pode ter outro atendimento sobreposto | 400 — "Você já tem um agendamento nesse horário" |

Além disso, um **índice único parcial** no banco
(`barbeiro_id, data, horario WHERE status = 'CONFIRMADO'`) fecha a corrida entre
duas reservas simultâneas: a segunda recebe
*"Esse horário acabou de ser reservado. Escolha outro."*

O agendamento nasce **CONFIRMADO** e com `dataCriacao` preenchida.

> Um ADMIN pode agendar em nome de um cliente informando `clienteId` no corpo.
> Para CLIENTE, esse campo é ignorado — o agendamento é sempre do usuário logado.

### 3. Remarcar

- Só o **cliente dono** do agendamento (ou um ADMIN) remarca.
- Só agendamentos **CONFIRMADOS** podem ser remarcados.
- Permite trocar de barbeiro junto com a data/hora (`barbeiroId` opcional).
- Todas as validações da criação são refeitas, ignorando o próprio agendamento na
  checagem de conflito.

### 4. Cancelar

- Podem cancelar: o **cliente**, o **barbeiro do atendimento** ou um **ADMIN**.
- Só vale para agendamentos CONFIRMADOS — cancelar um já concluído devolve 400.
- O registro não é apagado: vira `CANCELADO` e o horário volta a ficar livre.

### 5. Concluir atendimento

- Só o **barbeiro responsável** ou um **ADMIN**.
- Marca `CONCLUIDO` — é este status que alimenta a **receita** e o cálculo de
  **comissão** na gestão financeira.

### 6. Consultas

| Visão | Quem usa | O que devolve |
|---|---|---|
| Histórico do cliente | CLIENTE | Todos os agendamentos, mais recentes primeiro |
| Próximos do cliente | CLIENTE | Só CONFIRMADOS de hoje em diante |
| Agenda do barbeiro | BARBEIRO / ADMIN | Um dia específico, ordenado por horário |
| Agenda da barbearia | ADMIN | Todos os barbeiros no dia, com filtros |

Um cliente que tentar ler o agendamento de outro recebe **403**.

---

## Máquina de estados

```
                 criar
                   │
                   ▼
            ┌─────────────┐
   remarcar │ CONFIRMADO  │
   ◄────────┤             ├────────►  CANCELADO   (cliente, barbeiro ou admin)
            └──────┬──────┘
                   │ concluir (barbeiro/admin)
                   ▼
              CONCLUIDO   ← entra na receita e na comissão
```

`CONCLUIDO` e `CANCELADO` são estados finais: qualquer transição a partir deles
devolve HTTP 400.

---

## Endpoints

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/api/agendamentos/disponibilidade?barbeiroId&servicoId&data` | autenticado | Grade de horários livres |
| `GET` | `/api/agendamentos/meus` | CLIENTE (ADMIN com `clienteId`) | Histórico completo |
| `GET` | `/api/agendamentos/meus/proximos` | CLIENTE | Próximos confirmados |
| `GET` | `/api/agendamentos/agenda?barbeiroId&data` | BARBEIRO, ADMIN | Agenda de um barbeiro no dia |
| `GET` | `/api/agendamentos/dia?data` | ADMIN | Agenda da barbearia no dia |
| `GET` | `/api/agendamentos/{id}` | dono, barbeiro do atendimento ou ADMIN | Detalhe |
| `POST` | `/api/agendamentos` | CLIENTE, ADMIN | Cria (201) |
| `PUT` | `/api/agendamentos/{id}/remarcar` | CLIENTE, ADMIN | Nova data/hora (e barbeiro) |
| `PATCH` | `/api/agendamentos/{id}/cancelar` | cliente, barbeiro ou ADMIN | Cancela |
| `PATCH` | `/api/agendamentos/{id}/concluir` | BARBEIRO, ADMIN | Conclui |

### Exemplo — disponibilidade

```bash
curl "http://localhost:8080/api/agendamentos/disponibilidade?barbeiroId=2&servicoId=1&data=2026-09-18" \
  -H "Authorization: Bearer $TOKEN"
```

```json
{
  "barbeiroId": 2,
  "barbeiroNome": "Carlos Tesoura",
  "data": "2026-09-18",
  "servicoId": 1,
  "duracaoMinutos": 30,
  "horariosDisponiveis": ["09:00:00", "09:15:00", "09:30:00"],
  "horariosOcupados": ["10:00:00"]
}
```

### Exemplo — criar

```bash
curl -X POST http://localhost:8080/api/agendamentos \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"barbeiroId":2,"servicoId":1,"data":"2026-09-18","horario":"14:30:00"}'
```

A resposta (`AgendamentoResponse`) já vem achatada para a tela: nomes de cliente,
barbeiro e serviço, telefone do cliente, valor, `horarioFim` calculado e status.

---

## Telas

### Agendar horário (cliente)

Fluxo de 4 passos em uma página só, com resumo final antes de confirmar:

1. **Serviço** — cartões com categoria, duração e preço
2. **Barbeiro** — nome, especialidades e jornada
3. **Data** — seletor de data com atalhos "Hoje" e "Amanhã" (limite de 90 dias)
4. **Horário** — grade de botões; horários ocupados aparecem listados abaixo

Trocar serviço, barbeiro ou data limpa o horário selecionado e recarrega a grade.

### Meus agendamentos (cliente)

- Abas **Próximos / Concluídos / Cancelados** com contadores.
- Cada item mostra data, faixa de horário, barbeiro e valor.
- **Cancelar** abre confirmação; **Remarcar** abre um modal que já busca os
  horários livres da nova data escolhida.

### Agenda do dia (barbeiro)

- Navegação por dia (anterior / hoje / próximo) e seletor de data.
- Indicadores: confirmados, concluídos, faturamento previsto (com comissão
  estimada) e realizado.
- Cada atendimento traz o telefone do cliente e os botões **Concluir** e **Cancelar**.

### Agenda geral (admin)

Mesma lista, com filtros por **barbeiro** e **situação**, e totalizadores do dia.
