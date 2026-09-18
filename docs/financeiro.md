# Módulo: Gestão financeira

Cruza receita (atendimentos concluídos) e gastos (despesas) por período. Não é
uma entidade persistida — é cálculo sobre as demais.

**Backend:** `GestaoFinanceiraController`, `GestaoFinanceiraService`
**Frontend:** `pages/admin/GestaoFinanceira.jsx`, `pages/admin/PainelAdmin.jsx`

Acesso exclusivo do perfil **ADMIN** (`/api/financeiro/**`).

---

## O que entra na conta

| Componente | Origem | Entra no saldo? |
|---|---|---|
| Receita de serviços | `Agendamento` com status **CONCLUIDO** no período | ✅ (é o valor "ganhos") |
| Gastos | `Despesa` com `data` dentro do período | ✅ (é o valor "gastos") |
| Receita de assinaturas | `Assinatura` de cliente com `dataInicio` no período | ℹ️ informativo, exibido à parte |
| Comissões a pagar | Faturamento por barbeiro × percentual | ℹ️ indicador; só entra no saldo se lançado como despesa |

Agendamentos **confirmados** ou **cancelados** nunca contam como receita: só o
atendimento concluído vira dinheiro.

---

## Funcionalidades

### 1. Resumo do período

`GET /api/financeiro/resumo?inicio=&fim=` — o cálculo essencial:

```
saldoLiquido = ganhos − gastos
```

```json
{
  "periodoInicio": "2026-09-01",
  "periodoFim": "2026-09-30",
  "ganhos": 80.00,
  "gastos": 4230.00,
  "saldoLiquido": -4150.00
}
```

### 2. Relatório gerencial

`GET /api/financeiro/relatorio?inicio=&fim=` — o resumo mais o detalhamento:

| Campo | Conteúdo |
|---|---|
| `ganhos`, `gastos`, `saldoLiquido` | mesmos do resumo |
| `receitaServicos` | receita dos atendimentos concluídos |
| `receitaAssinaturas` | planos contratados no período (informativo) |
| `totalComissoes` | soma das comissões a pagar |
| `atendimentosConcluidos` | quantidade no período |
| `ticketMedio` | receita de serviços ÷ atendimentos concluídos |
| `receitaPorServico` | ranking: rótulo, quantidade e total |
| `receitaPorBarbeiro` | ranking: rótulo, quantidade e total |
| `gastosPorCategoria` | ranking de despesas |
| `evolucaoDiaria` | série diária (data, valor, quantidade) para o gráfico |
| `comissoes` | por barbeiro: atendimentos, faturamento, percentual e valor |

Os agrupamentos são feitos em SQL (`group by`), não em memória.

### 3. Comparativo entre períodos

`GET /api/financeiro/comparativo?inicioA&fimA&inicioB&fimB` devolve os dois
resumos e as variações absolutas (`B − A`) de ganhos, gastos e saldo.

Na tela, o botão **Comparar com período anterior** monta automaticamente um período
A de mesma duração, imediatamente anterior ao selecionado.

### 4. Painel administrativo

`GET /api/financeiro/dashboard` entrega os indicadores do topo do painel em uma
chamada só:

| Campo | Significado |
|---|---|
| `agendamentosHoje` | confirmados + concluídos de hoje |
| `agendamentosConcluidosHoje` | concluídos de hoje |
| `agendamentosMes` | concluídos no mês corrente |
| `faturamentoHoje` / `faturamentoMes` | receita de serviços |
| `despesasMes` | despesas do mês corrente |
| `saldoMes` | faturamento do mês − despesas do mês |
| `produtosEmEstoqueBaixo` | produtos no mínimo ou abaixo |
| `barbeirosAtivos` | equipe ativa |
| `clientesComAssinatura` | clientes com assinatura vinculada |

### 5. Cálculo de comissões

Para cada barbeiro com atendimentos concluídos no período:

```
faturamento = Σ preço dos serviços concluídos
comissão    = faturamento × percentual ÷ 100     (HALF_UP, 2 casas)
```

O percentual vem do cadastro do barbeiro no momento da consulta — alterar a
comissão muda o valor calculado inclusive para períodos passados. Se precisar
congelar o percentual histórico, o caminho é lançar o pagamento como despesa
assim que ele for apurado.

---

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/financeiro/resumo?inicio&fim` | Ganhos, gastos e saldo |
| `GET` | `/api/financeiro/relatorio?inicio&fim` | Relatório detalhado |
| `GET` | `/api/financeiro/comparativo?inicioA&fimA&inicioB&fimB` | Comparação entre dois períodos |
| `GET` | `/api/financeiro/dashboard` | Indicadores de hoje e do mês |

Todos exigem ADMIN. Datas no formato ISO `yyyy-MM-dd`. Data inicial posterior à
final devolve **400**.

---

## Tela — Gestão financeira (`/admin/financeiro`)

Estrutura de cima para baixo:

1. **Filtro de período** com atalhos 7 dias, 30 dias e mês atual.
2. **Quatro indicadores principais:** ganhos, gastos, saldo líquido (verde/vermelho
   conforme o sinal) e ticket médio.
3. **Três indicadores de composição:** receita de serviços, receita de assinaturas
   (marcada como informativa) e comissões a pagar.
4. **Comparativo** (sob demanda): tabela com período anterior, atual e variação.
   Em gastos, a variação é lida ao contrário — gastar menos é bom.
5. **Receita por serviço** e **receita por barbeiro** em barras proporcionais.
6. **Gastos por categoria** (barras em vermelho) e **comissões por barbeiro** (tabela).
7. **Evolução diária da receita** em gráfico de colunas, com o valor e a quantidade
   de atendimentos no *tooltip* de cada dia.

Todos os blocos têm estado vazio próprio quando não há dados no período.

## Tela — Painel da barbearia (`/admin`)

Indicadores do dia e do mês, agenda de hoje (8 primeiros atendimentos, com link
para a agenda completa) e alerta de estoque com atalho para reposição.
