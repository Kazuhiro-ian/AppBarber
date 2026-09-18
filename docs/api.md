# Referência rápida da API

Base: `http://localhost:8080/api`
Autenticação: `Authorization: Bearer <token>` (obtido em `/auth/login`).

Legenda de acesso: **pub** = público · **aut** = qualquer autenticado ·
**CLI** = cliente · **BAR** = barbeiro · **ADM** = administrador

---

## Autenticação — `/auth`

| Método | Rota | Acesso | Corpo | Resposta |
|---|---|---|---|---|
| POST | `/auth/registrar` | pub | `RegistroRequest` | 201 `AuthResponse` |
| POST | `/auth/login` | pub | `LoginRequest` | 200 `AuthResponse` |
| GET | `/auth/eu` | aut | — | 200 `UsuarioResponse` |
| PUT | `/auth/perfil` | aut | `AtualizarPerfilRequest` | 200 `UsuarioResponse` |
| PATCH | `/auth/senha` | aut | `AlterarSenhaRequest` | 204 |

## Agendamentos — `/agendamentos`

| Método | Rota | Acesso | Resposta |
|---|---|---|---|
| GET | `/agendamentos/disponibilidade?barbeiroId&servicoId&data` | aut | `DisponibilidadeResponse` |
| GET | `/agendamentos/meus?clienteId` | CLI (ADM) | `AgendamentoResponse[]` |
| GET | `/agendamentos/meus/proximos` | CLI | `AgendamentoResponse[]` |
| GET | `/agendamentos/agenda?barbeiroId&data` | BAR, ADM | `AgendamentoResponse[]` |
| GET | `/agendamentos/dia?data` | ADM | `AgendamentoResponse[]` |
| GET | `/agendamentos/{id}` | dono/BAR/ADM | `AgendamentoResponse` |
| POST | `/agendamentos` | CLI, ADM | 201 `AgendamentoResponse` |
| PUT | `/agendamentos/{id}/remarcar` | CLI, ADM | `AgendamentoResponse` |
| PATCH | `/agendamentos/{id}/cancelar` | dono/BAR/ADM | `AgendamentoResponse` |
| PATCH | `/agendamentos/{id}/concluir` | BAR, ADM | `AgendamentoResponse` |

## Barbeiros — `/barbeiros`

| Método | Rota | Acesso | Resposta |
|---|---|---|---|
| GET | `/barbeiros` | aut | `BarbeiroResponse[]` (ativos, visão pública) |
| GET | `/barbeiros/gerenciar` | ADM | `BarbeiroResponse[]` |
| GET | `/barbeiros/{id}` | aut | `BarbeiroResponse` |
| GET | `/barbeiros/eu` | BAR | `BarbeiroResponse` |
| PUT | `/barbeiros/eu` | BAR | `BarbeiroResponse` |
| GET | `/barbeiros/painel?barbeiroId&data` | BAR, ADM | `PainelBarbeiroResponse` |
| GET | `/barbeiros/agenda?barbeiroId&data` | BAR, ADM | `AgendaDiaResponse` |
| GET | `/barbeiros/comissao?barbeiroId&inicio&fim` | BAR, ADM | `ComissaoResponse` |
| POST | `/barbeiros` | ADM | 201 `BarbeiroResponse` |
| PUT | `/barbeiros/{id}` | ADM | `BarbeiroResponse` |
| PATCH | `/barbeiros/{id}/status?ativo=` | ADM | `BarbeiroResponse` |

## Serviços — `/servicos`

| Método | Rota | Acesso | Resposta |
|---|---|---|---|
| GET | `/servicos?apenasAtivos&categoria` | pub | `ServicoResponse[]` |
| GET | `/servicos/{id}` | pub | `ServicoResponse` |
| POST | `/servicos` | ADM | 201 `ServicoResponse` |
| PUT | `/servicos/{id}` | ADM | `ServicoResponse` |
| DELETE | `/servicos/{id}` | ADM | 204 (inativa) |
| PATCH | `/servicos/{id}/reativar` | ADM | `ServicoResponse` |

## Planos — `/planos`

| Método | Rota | Acesso | Resposta |
|---|---|---|---|
| GET | `/planos` | pub | `PlanoResponse[]` |
| GET | `/planos/gerenciar` | ADM | `PlanoResponse[]` (com assinantes) |
| GET | `/planos/{id}` | pub | `PlanoResponse` |
| POST | `/planos` | ADM | 201 `PlanoResponse` |
| PUT | `/planos/{id}` | ADM | `PlanoResponse` |
| DELETE | `/planos/{id}` | ADM | 204 (exclui ou desativa) |

## Assinaturas — `/assinaturas`

| Método | Rota | Acesso | Resposta |
|---|---|---|---|
| GET | `/assinaturas/minha` | CLI | 200 `AssinaturaResponse` ou **204** |
| POST | `/assinaturas/planos/{planoId}` | CLI | 201 `AssinaturaResponse` |
| PATCH | `/assinaturas/minha/renovar` | CLI | `AssinaturaResponse` |
| DELETE | `/assinaturas/minha` | CLI | `AssinaturaResponse` |

## Clientes — `/clientes`

| Método | Rota | Acesso | Resposta |
|---|---|---|---|
| GET | `/clientes/home` | CLI | `HomeClienteResponse` |
| GET | `/clientes?nome=` | ADM | `ClienteResponse[]` |
| GET | `/clientes/assinantes` | ADM | `ClienteResponse[]` |
| GET | `/clientes/{id}` | ADM | `ClienteResponse` |

## Produtos (estoque) — `/produtos`

| Método | Rota | Acesso | Resposta |
|---|---|---|---|
| GET | `/produtos?nome&categoria` | BAR, ADM | `ProdutoResponse[]` |
| GET | `/produtos/estoque-baixo` | BAR, ADM | `ProdutoResponse[]` |
| GET | `/produtos/{id}` | BAR, ADM | `ProdutoResponse` |
| POST | `/produtos` | ADM | 201 `ProdutoResponse` |
| PUT | `/produtos/{id}` | ADM | `ProdutoResponse` |
| DELETE | `/produtos/{id}` | ADM | 204 |
| PATCH | `/produtos/{id}/baixa` | BAR, ADM | `ProdutoResponse` |
| PATCH | `/produtos/{id}/entrada` | ADM | `ProdutoResponse` |

## Despesas — `/despesas`

| Método | Rota | Acesso | Resposta |
|---|---|---|---|
| GET | `/despesas?inicio&fim&categoria&barbeiroId` | ADM | `DespesaResponse[]` |
| GET | `/despesas/categorias` | ADM | `String[]` |
| GET | `/despesas/{id}` | ADM | `DespesaResponse` |
| POST | `/despesas` | ADM | 201 `DespesaResponse` |
| PUT | `/despesas/{id}` | ADM | `DespesaResponse` |
| DELETE | `/despesas/{id}` | ADM | 204 |

## Financeiro — `/financeiro`

| Método | Rota | Acesso | Resposta |
|---|---|---|---|
| GET | `/financeiro/resumo?inicio&fim` | ADM | `ResumoFinanceiroResponse` |
| GET | `/financeiro/relatorio?inicio&fim` | ADM | `RelatorioFinanceiroResponse` |
| GET | `/financeiro/comparativo?inicioA&fimA&inicioB&fimB` | ADM | `ComparativoPeriodosResponse` |
| GET | `/financeiro/dashboard` | ADM | `ResumoDashboardResponse` |

---

## Códigos de status

| Código | Quando |
|---|---|
| 200 | Sucesso |
| 201 | Recurso criado |
| 204 | Sucesso sem corpo (exclusão, troca de senha, cliente sem assinatura) |
| 400 | Validação ou regra de negócio violada |
| 401 | Sem token, token inválido/expirado, credenciais erradas |
| 403 | Perfil sem permissão ou recurso de outro usuário |
| 404 | Recurso não encontrado |
| 500 | Erro inesperado (detalhe apenas no log do servidor) |

## Formato de erro

```json
{
  "timestamp": "2026-09-17T00:30:32.36",
  "status": 400,
  "erro": "Bad Request",
  "mensagem": "Há campos inválidos na requisição",
  "caminho": "/api/servicos",
  "campos": { "preco": "O preço não pode ser negativo" }
}
```

O campo `campos` só aparece em falhas de Bean Validation.

## Convenções

- Datas: `yyyy-MM-dd` — horas: `HH:mm:ss` — data/hora: `yyyy-MM-ddTHH:mm:ss`
- Valores monetários: número JSON com 2 casas decimais
- Campos nulos são omitidos da resposta (`default-property-inclusion: non_null`)
- Parâmetros de período (`inicio`/`fim`) são inclusivos nas duas pontas
