# Módulo: Serviços

Catálogo do que a barbearia oferece. É a base do agendamento (duração e preço) e
da receita.

**Backend:** `ServicoController`, `ServicoService`, `Servico`, `ServicoRepository`
**Frontend:** `pages/admin/GestaoServicos.jsx`, `pages/cliente/ServicosAssinaturas.jsx`,
usado também em `pages/cliente/AgendarHorario.jsx`

---

## Funcionalidades

### 1. Vitrine

`GET /api/servicos` é **público** (não exige token) — serve tanto para a tela de
agendamento quanto para uma futura página institucional.

- `?apenasAtivos=true` (padrão) devolve só o que está disponível.
- `?apenasAtivos=false` devolve tudo, incluindo inativos — usado na gestão.
- `?categoria=Cabelo` filtra por categoria.

Na tela do cliente, os serviços são agrupados por categoria em ordem alfabética.

### 2. Cadastro (ADMIN)

- Nome é obrigatório e **único** (comparação sem diferenciar maiúsculas):
  nome repetido devolve 400.
- Duração de 5 a 480 minutos, em múltiplos livres — é ela que define quanto tempo
  o serviço bloqueia na agenda.
- Preço não negativo, com 2 casas decimais.
- Nasce ativo, a menos que `ativo: false` seja enviado.

### 3. Edição

Atualiza nome, categoria, duração, preço e situação. Mudar a duração afeta apenas
os **novos** agendamentos — os já marcados mantêm o horário de término calculado
na criação.

### 4. Exclusão lógica

`DELETE /api/servicos/{id}` **não apaga** o registro: marca `ativo = false`.

Motivo: agendamentos antigos apontam para o serviço, e apagá-lo quebraria o
histórico e os relatórios financeiros. O serviço inativo:

- some da vitrine e da tela de agendamento;
- é recusado se alguém tentar agendá-lo direto pela API (400);
- continua aparecendo no histórico e nos relatórios.

`PATCH /api/servicos/{id}/reativar` desfaz a inativação.

---

## Endpoints

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/api/servicos?apenasAtivos&categoria` | **público** | Lista o catálogo |
| `GET` | `/api/servicos/{id}` | **público** | Detalhe |
| `POST` | `/api/servicos` | ADMIN | Cadastra (201) |
| `PUT` | `/api/servicos/{id}` | ADMIN | Edita |
| `DELETE` | `/api/servicos/{id}` | ADMIN | Inativa (204) |
| `PATCH` | `/api/servicos/{id}/reativar` | ADMIN | Reativa |

### Exemplo — cadastrar

```bash
curl -X POST http://localhost:8080/api/servicos \
  -H "Authorization: Bearer $TOKEN_ADMIN" -H 'Content-Type: application/json' \
  -d '{"nome":"Corte + Barba","categoria":"Combo","duracaoMinutos":60,"preco":80.00}'
```

```json
{
  "id": 4,
  "nome": "Corte + Barba",
  "categoria": "Combo",
  "duracaoMinutos": 60,
  "preco": 80.00,
  "ativo": true
}
```

---

## Validações

| Campo | Regra |
|---|---|
| `nome` | obrigatório, até 120 caracteres, único |
| `categoria` | opcional, até 80 caracteres |
| `duracaoMinutos` | de 5 a 480 |
| `preco` | obrigatório, ≥ 0, até 8 inteiros e 2 decimais |
| `ativo` | opcional (padrão `true`) |

---

## Carga inicial

A migration V2 já traz sete serviços prontos:

| Serviço | Categoria | Duração | Preço |
|---|---|---|---|
| Corte masculino | Cabelo | 30 min | R$ 45,00 |
| Corte degradê | Cabelo | 40 min | R$ 55,00 |
| Barba completa | Barba | 30 min | R$ 40,00 |
| Corte + Barba | Combo | 60 min | R$ 80,00 |
| Pezinho | Cabelo | 15 min | R$ 20,00 |
| Hidratação capilar | Tratamento | 45 min | R$ 70,00 |
| Pigmentação | Tratamento | 30 min | R$ 50,00 |

---

## Tela — Serviços (`/admin/servicos`)

Tabela com nome, categoria, duração, preço e situação. Ações por linha:
**Editar**, **Inativar** (com confirmação explicando que o histórico é preservado)
e **Reativar**. O botão **Novo serviço** abre o mesmo formulário em modo de criação.

A tabela rola horizontalmente no celular, mantendo as colunas legíveis.
