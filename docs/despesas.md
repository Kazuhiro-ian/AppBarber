# Módulo: Despesas

Registro dos gastos da barbearia. É o lado dos custos da gestão financeira.

**Backend:** `DespesaController`, `DespesaService`, `Despesa`, `DespesaRepository`
**Frontend:** `pages/admin/GestaoDespesas.jsx`

---

## Funcionalidades

### 1. CRUD completo (ADMIN)

Cada despesa tem categoria, valor, data, descrição opcional e, opcionalmente, um
barbeiro vinculado.

- **Categoria** é texto livre — a barbearia usa o vocabulário que quiser
  (Aluguel, Energia, Insumos, Marketing, Manutenção…). O formulário sugere as
  categorias já utilizadas por meio de um `datalist`.
- **Data** determina em qual período a despesa entra nos relatórios.
- **Barbeiro** é opcional: serve para gastos ligados a um profissional específico
  (material de uso pessoal, curso, adiantamento). Sem barbeiro, é uma despesa da
  barbearia. Se o barbeiro for removido, a FK usa `ON DELETE SET NULL` e a despesa
  continua existindo.

### 2. Consultas

| Filtro | Rota |
|---|---|
| Por período | `GET /api/despesas?inicio=&fim=` |
| Por categoria | `GET /api/despesas?categoria=Aluguel` |
| Por barbeiro | `GET /api/despesas?barbeiroId=2` |
| Todas | `GET /api/despesas` |

Sempre ordenadas por data decrescente. Período com data inicial posterior à final
devolve 400.

### 3. Categorias já usadas

`GET /api/despesas/categorias` devolve as categorias distintas em ordem alfabética,
usada para o autocompletar do formulário.

### 4. Totalizadores da tela

Calculados no frontend sobre o período filtrado:

- **Total no período** — soma dos valores
- **Lançamentos** — quantidade
- **Ticket médio** — total ÷ quantidade
- **Gastos por categoria** — ranking em barras proporcionais

O mesmo agrupamento por categoria é calculado no backend
(`DespesaRepository.totalizarPorCategoria`) e entra no relatório gerencial.

### 5. Ligação com a gestão financeira

As despesas do período são o valor **gastos** em:

- `GET /api/financeiro/resumo` — saldo do período
- `GET /api/financeiro/relatorio` — com a quebra por categoria
- `GET /api/financeiro/dashboard` — despesas do mês corrente

> A **comissão dos barbeiros não é lançada automaticamente** como despesa. O
> relatório financeiro mostra o total de comissões a pagar como indicador
> separado; se a barbearia quiser que ela entre no saldo, basta registrar o
> pagamento como uma despesa da categoria "Comissões".

---

## Endpoints

Todos exigem perfil **ADMIN** (barbeiro e cliente recebem 403).

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/despesas?inicio&fim&categoria&barbeiroId` | Lista com filtros |
| `GET` | `/api/despesas/categorias` | Categorias já utilizadas |
| `GET` | `/api/despesas/{id}` | Detalhe |
| `POST` | `/api/despesas` | Cadastra (201) |
| `PUT` | `/api/despesas/{id}` | Edita |
| `DELETE` | `/api/despesas/{id}` | Exclui (204) |

### Exemplo — cadastrar

```bash
curl -X POST http://localhost:8080/api/despesas \
  -H "Authorization: Bearer $TOKEN_ADMIN" -H 'Content-Type: application/json' \
  -d '{"categoria":"Manutenção","valor":320.50,"data":"2026-09-17","descricao":"Conserto da cadeira"}'
```

```json
{
  "id": 5,
  "categoria": "Manutenção",
  "valor": 320.50,
  "data": "2026-09-17",
  "descricao": "Conserto da cadeira",
  "barbeiroId": null,
  "barbeiroNome": null
}
```

---

## Validações

| Campo | Regra |
|---|---|
| `categoria` | obrigatória, até 80 caracteres |
| `valor` | obrigatório, ≥ 0, até 8 inteiros e 2 decimais |
| `data` | obrigatória (formato ISO `yyyy-MM-dd`) |
| `descricao` | opcional, até 300 caracteres |
| `barbeiroId` | opcional; se informado, precisa existir (senão 404) |

---

## Carga inicial

A migration V2 cria quatro despesas relativas aos últimos dias, para que os
relatórios já tenham dados no primeiro acesso:

| Categoria | Valor | Quando |
|---|--:|---|
| Aluguel | R$ 2.500,00 | 10 dias atrás |
| Energia | R$ 480,00 | 8 dias atrás |
| Insumos | R$ 950,00 | 5 dias atrás |
| Marketing | R$ 300,00 | 2 dias atrás |

---

## Tela — Despesas (`/admin/despesas`)

- Filtro por período com atalho **Mês atual**.
- Três indicadores: total, número de lançamentos e ticket médio.
- Gráfico de barras de **gastos por categoria**.
- Tabela com data, categoria, descrição, barbeiro e valor, com **Editar** e
  **Excluir** (este com confirmação mostrando valor e data).
- **Nova despesa** abre o formulário com autocompletar de categoria e seletor de
  barbeiro ("Despesa da barbearia" quando nenhum é escolhido).
