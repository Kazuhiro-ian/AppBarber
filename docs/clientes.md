# Módulo: Clientes

Home consolidada do cliente e base de clientes para o administrador.

**Backend:** `ClienteController`, `ClienteService`, `Cliente`, `ClienteRepository`
**Frontend:** `pages/cliente/HomeCliente.jsx`, `pages/admin/Clientes.jsx`

---

## Funcionalidades

### 1. Home do cliente

`GET /api/clientes/home` entrega, em **uma única chamada**, tudo o que a tela
inicial precisa — evitando três ou quatro requisições em sequência no celular:

| Campo | Conteúdo |
|---|---|
| `nome`, `fotoPerfil` | dados para a saudação e o avatar |
| `proximoAgendamento` | primeiro atendimento confirmado a partir de agora |
| `proximosAgendamentos` | até 5 próximos confirmados |
| `totalAtendimentos` | quantidade de agendamentos concluídos (histórico) |
| `totalGasto` | soma dos serviços concluídos |
| `assinatura` | assinatura vinculada, com status e vigência |

"Próximo" considera data **e** hora: um horário de hoje que já passou não aparece.

### 2. Base de clientes (ADMIN)

`GET /api/clientes` lista todos os clientes com nome, e-mail, telefone, foto e a
assinatura vinculada (quando houver). Aceita `?nome=` para filtrar no servidor;
a tela também filtra localmente por nome, e-mail ou telefone.

`GET /api/clientes/assinantes` traz só quem tem assinatura vinculada — inclusive
canceladas ou expiradas, já que o campo `assinaturaAtiva` guarda o histórico.
Para contar apenas quem está **vigente**, use o campo `vigente` de cada assinatura
(é o que a tela faz nos indicadores).

### 3. Indicadores da tela

| Indicador | Cálculo |
|---|---|
| Clientes cadastrados | total de contas de cliente |
| Com assinatura vigente | assinaturas com `vigente = true` |
| Receita recorrente | soma dos preços das assinaturas vigentes |

---

## Permissões

| Ação | CLIENTE | ADMIN |
|---|:--:|:--:|
| Ver a própria home | ✅ | ❌ (403 — área exclusiva de cliente) |
| Listar clientes | ❌ (403) | ✅ |
| Ver detalhe de um cliente | ❌ | ✅ |

Não existe endpoint para o ADMIN editar ou excluir um cliente: o cadastro é do
próprio usuário e é mantido por ele em `/api/auth/perfil`. Isso evita exclusões
que quebrariam o histórico de agendamentos.

---

## Endpoints

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/api/clientes/home` | CLIENTE | Home consolidada |
| `GET` | `/api/clientes?nome=` | ADMIN | Lista de clientes |
| `GET` | `/api/clientes/assinantes` | ADMIN | Clientes com assinatura vinculada |
| `GET` | `/api/clientes/{id}` | ADMIN | Detalhe |

### Exemplo — home

```bash
curl http://localhost:8080/api/clientes/home -H "Authorization: Bearer $TOKEN_CLIENTE"
```

```json
{
  "nome": "Joao da Silva",
  "proximoAgendamento": {
    "id": 12,
    "servicoNome": "Barba completa",
    "barbeiroNome": "Carlos Tesoura",
    "data": "2026-09-18",
    "horario": "14:30:00",
    "horarioFim": "15:00:00",
    "valor": 40.00,
    "status": "CONFIRMADO"
  },
  "proximosAgendamentos": [ "..." ],
  "totalAtendimentos": 1,
  "totalGasto": 40.00,
  "assinatura": null
}
```

---

## Telas

### Home do cliente (`/`)

- Saudação pelo primeiro nome e botão **Agendar horário**.
- Cartão em destaque do **próximo atendimento** (serviço, barbeiro, "Hoje" ou data
  por extenso, horário e valor) — ou estado vazio convidando a agendar.
- Três indicadores: atendimentos concluídos, total investido e assinatura.
- Lista dos demais horários marcados, com link para "Meus agendamentos".
- Cartão da assinatura vigente, com status e data de renovação.

### Clientes (`/admin/clientes`)

Três indicadores no topo, campo de busca e lista com avatar, contato e a situação
da assinatura de cada cliente (etiqueta **Ativa**, **Cancelada**, **Expirada** ou
**Sem assinatura**).
