# Módulo: Estoque de produtos

Controle de produtos, entradas e saídas, com alerta de estoque mínimo.

**Backend:** `ProdutoController`, `ProdutoService`, `Produto`, `ProdutoRepository`
**Frontend:** `pages/admin/GestaoEstoque.jsx` (a mesma tela serve ADMIN e BARBEIRO)

---

## Funcionalidades

### 1. Cadastro de produtos (ADMIN)

Nome, categoria, quantidade inicial, quantidade mínima, preço de custo e preço de
venda. Nenhum valor pode ser negativo — há validação no DTO e *check constraint*
no banco.

### 2. Consulta e busca

- Lista completa, com o indicador `estoqueBaixo` já calculado por produto.
- Busca por nome: `GET /api/produtos?nome=pomada` (contém, sem diferenciar
  maiúsculas).
- Filtro por categoria: `GET /api/produtos?categoria=Barba`.
- A busca da tela filtra localmente por nome **ou** categoria, sem ida ao servidor.

### 3. Saída de estoque (baixa)

Registra o consumo do produto no atendimento.

- **Permitida ao BARBEIRO** — é ele quem usa o produto na cadeira.
- Quantidade precisa ser ≥ 1.
- Baixa maior que o estoque disponível é recusada com 400
  (*"Estoque insuficiente para 'X': disponível N, solicitado M"*), e o estoque
  permanece intacto.

### 4. Entrada de estoque (reposição)

Soma unidades ao estoque. **Exclusiva do ADMIN** — compras e reposição são decisão
de gestão. Um barbeiro que tentar repor recebe 403.

### 5. Alerta de estoque mínimo

`verificarEstoqueMinimo()` devolve `true` quando `quantidade <= quantidadeMinima`.

- `GET /api/produtos/estoque-baixo` lista todos nessa situação, ordenados por nome.
- O painel administrativo mostra o total em destaque e a lista dos produtos que
  precisam de reposição.
- A tela de estoque exibe uma faixa de aviso e marca as linhas com a etiqueta **Repor**.

### 6. Exclusão

`DELETE /api/produtos/{id}` remove o produto de fato. Ao contrário de serviços e
barbeiros, produtos não têm histórico de agendamento apontando para eles, então a
exclusão física é segura.

### 7. Indicadores da tela

Calculados no frontend a partir da lista:

| Indicador | Cálculo |
|---|---|
| Itens cadastrados | número de produtos |
| Unidades em estoque | soma das quantidades |
| Valor imobilizado | Σ (quantidade × preço de custo) |
| Abaixo do mínimo | produtos com `estoqueBaixo` |

O domínio ainda oferece `margemUnitaria()` (venda − custo) por produto.

---

## Permissões

| Ação | BARBEIRO | ADMIN |
|---|:--:|:--:|
| Listar / buscar | ✅ | ✅ |
| Ver alerta de estoque baixo | ✅ | ✅ |
| Dar baixa (saída) | ✅ | ✅ |
| Entrada (reposição) | ❌ | ✅ |
| Cadastrar / editar / excluir | ❌ | ✅ |

CLIENTE não tem acesso a nenhum endpoint de `/api/produtos` (403).

---

## Endpoints

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/api/produtos?nome&categoria` | ADMIN, BARBEIRO | Lista com filtros |
| `GET` | `/api/produtos/estoque-baixo` | ADMIN, BARBEIRO | Produtos no mínimo ou abaixo |
| `GET` | `/api/produtos/{id}` | ADMIN, BARBEIRO | Detalhe |
| `POST` | `/api/produtos` | ADMIN | Cadastra (201) |
| `PUT` | `/api/produtos/{id}` | ADMIN | Edita |
| `DELETE` | `/api/produtos/{id}` | ADMIN | Exclui (204) |
| `PATCH` | `/api/produtos/{id}/baixa` | ADMIN, BARBEIRO | Saída de estoque |
| `PATCH` | `/api/produtos/{id}/entrada` | ADMIN | Entrada de estoque |

### Exemplo — dar baixa

```bash
curl -X PATCH http://localhost:8080/api/produtos/1/baixa \
  -H "Authorization: Bearer $TOKEN_BARBEIRO" -H 'Content-Type: application/json' \
  -d '{"quantidade":2}'
```

```json
{
  "id": 1,
  "nome": "Pomada modeladora 120g",
  "categoria": "Finalizador",
  "quantidade": 22,
  "quantidadeMinima": 10,
  "precoCusto": 18.00,
  "precoVenda": 39.90,
  "estoqueBaixo": false
}
```

---

## Validações

| Campo | Regra |
|---|---|
| `nome` | obrigatório, até 120 caracteres |
| `categoria` | opcional, até 80 caracteres |
| `quantidade` | ≥ 0 |
| `quantidadeMinima` | ≥ 0 |
| `precoCusto`, `precoVenda` | obrigatórios, ≥ 0, até 8 inteiros e 2 decimais |
| `quantidade` (movimentação) | ≥ 1 |

---

## Carga inicial

| Produto | Categoria | Estoque | Mínimo | Custo | Venda |
|---|---|--:|--:|--:|--:|
| Pomada modeladora 120g | Finalizador | 24 | 10 | R$ 18,00 | R$ 39,90 |
| Shampoo anticaspa 300ml | Higiene | 12 | 6 | R$ 22,50 | R$ 49,90 |
| Óleo para barba 30ml | Barba | 8 | 10 | R$ 15,00 | R$ 35,00 |
| Lâmina de barbear (cx) | Insumo | 40 | 15 | R$ 9,90 | R$ 24,90 |
| Talco pós-barba | Barba | 5 | 8 | R$ 7,50 | R$ 19,90 |

Os dois últimos já nascem abaixo do mínimo, para demonstrar o alerta.

---

## Tela — Gestão de estoque

Rota `/admin/estoque` (ADMIN) e `/barbeiro/estoque` (BARBEIRO) — **o mesmo
componente**, que esconde as ações que o perfil não pode executar, espelhando as
regras do backend.

- Quatro indicadores no topo e faixa de aviso quando há produtos no mínimo.
- Campo de busca por nome ou categoria.
- Tabela com estoque, mínimo, custo, venda e situação (**Ok** / **Repor**).
- Ações por linha: **Baixa** (todos), **Entrada**, **Editar** e **Excluir** (ADMIN).
- Movimentações abrem um modal que mostra o estoque atual antes de confirmar.
