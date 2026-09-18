# Módulo: Assinaturas e planos

Planos recorrentes da barbearia e a assinatura de cada cliente.

**Backend:** `PlanoController`, `AssinaturaController`, `AssinaturaService`,
`Assinatura`, `AssinaturaRepository`
**Frontend:** `pages/cliente/ServicosAssinaturas.jsx`, `pages/admin/GestaoPlanos.jsx`

---

## Modelo: catálogo x assinatura

A entidade `Assinatura` cumpre dois papéis, distinguidos pela coluna `modelo`:

| | `modelo = true` | `modelo = false` |
|---|---|---|
| O que é | **Plano do catálogo** | **Assinatura de um cliente** |
| Quem cria | ADMIN | O cliente, ao contratar |
| Tem vigência? | Não (`dataInicio` nulo) | Sim (`dataInicio`, `dataRenovacao`) |
| Campo `ativo` | Disponível para contratação | não se aplica |
| Campo `plano` | nulo | aponta para o plano de origem |

**Por que a cópia?** Contratar um plano cria uma cópia dele para o cliente. Assim,
cancelar, renovar ou expirar a assinatura de alguém nunca altera o plano que os
outros clientes veem — e um reajuste de preço no catálogo não muda retroativamente
o valor de quem já assinou.

---

## Funcionalidades

### 1. Vitrine de planos (público)

`GET /api/planos` devolve os planos **ativos** do catálogo, ordenados por preço,
com nome, benefícios, preço e periodicidade. É público, para permitir uma página
de vendas sem login.

### 2. Gestão do catálogo (ADMIN)

- **Criar:** nome único no catálogo, preço, periodicidade (`MENSAL`, `TRIMESTRAL`,
  `ANUAL`) e lista de benefícios (normalizada: sem vazios nem duplicatas).
- **Editar:** todos os campos, inclusive a disponibilidade.
- **Remover:** se o plano **não** tem assinantes ativos, é excluído de fato.
  Se tem, é apenas **desativado** — as assinaturas em andamento continuam válidas.
  A interface avisa qual dos dois vai acontecer antes de confirmar.
- `GET /api/planos/gerenciar` traz o catálogo completo, inclusive inativos, com a
  contagem de assinantes ativos de cada plano.

### 3. Contratar (CLIENTE)

- Cria a cópia do plano e já a ativa: `dataInicio = hoje` e
  `dataRenovacao = hoje + periodicidade`.
- Vincula a assinatura ao cliente (`cliente.assinatura_id`).
- **Um plano por vez:** se o cliente já tem assinatura vigente, a contratação é
  recusada com 400 pedindo que cancele antes.
- Plano indisponível (`ativo = false`) não pode ser contratado.

### 4. Renovar

Estende a vigência em mais um período. A base é a `dataRenovacao` atual, se ainda
estiver no futuro; caso contrário, é a data de hoje — então renovar uma assinatura
vencida não "perde" o tempo parado. Assinatura **cancelada** não pode ser renovada.

### 5. Cancelar

Marca `CANCELADA`. Os benefícios acabam na hora. O vínculo com o cliente é mantido
para o histórico, mas `possuiAssinaturaVigente()` passa a devolver `false`, o que
libera a contratação de um novo plano.

### 6. Expiração automática

`verificarValidade()` é chamado sempre que a assinatura é lida. Se a
`dataRenovacao` já passou, o status vira **EXPIRADA** e a assinatura deixa de ser
vigente — sem necessidade de job agendado.

---

## Ciclo de vida

```
   catálogo (modelo = true)
        │  contratar()
        ▼
     ATIVA ──── renovar() ────► ATIVA (dataRenovacao + período)
       │  │
       │  └── dataRenovacao vencida ──► EXPIRADA
       │
       └── cancelar() ──► CANCELADA  (não renova mais)
```

---

## Endpoints

### Catálogo — `/api/planos`

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/api/planos` | **público** | Planos disponíveis |
| `GET` | `/api/planos/gerenciar` | ADMIN | Catálogo completo + assinantes ativos |
| `GET` | `/api/planos/{id}` | **público** | Detalhe do plano |
| `POST` | `/api/planos` | ADMIN | Cria (201) |
| `PUT` | `/api/planos/{id}` | ADMIN | Edita |
| `DELETE` | `/api/planos/{id}` | ADMIN | Remove ou desativa (204) |

### Assinatura do cliente — `/api/assinaturas`

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/api/assinaturas/minha` | CLIENTE | Assinatura vigente — **204** se não houver |
| `POST` | `/api/assinaturas/planos/{planoId}` | CLIENTE | Contrata (201) |
| `PATCH` | `/api/assinaturas/minha/renovar` | CLIENTE | Renova |
| `DELETE` | `/api/assinaturas/minha` | CLIENTE | Cancela |

### Exemplo — contratar

```bash
curl -X POST http://localhost:8080/api/assinaturas/planos/2 \
  -H "Authorization: Bearer $TOKEN_CLIENTE"
```

```json
{
  "id": 7,
  "planoId": 2,
  "nome": "Plano Premium",
  "beneficios": ["4 cortes por mês", "Barba ilimitada", "20% de desconto em produtos"],
  "preco": 149.90,
  "periodicidade": "MENSAL",
  "dataInicio": "2026-09-17",
  "dataRenovacao": "2026-10-17",
  "status": "ATIVA",
  "vigente": true,
  "diasParaRenovacao": 30
}
```

---

## Validações

| Campo | Regra |
|---|---|
| `nome` | obrigatório, até 120 caracteres, único no catálogo |
| `preco` | obrigatório, ≥ 0 |
| `periodicidade` | obrigatória: `MENSAL`, `TRIMESTRAL` ou `ANUAL` |
| `beneficios` | até 15 itens, cada um com até 200 caracteres |
| `ativo` | opcional (padrão `true`) |

---

## Carga inicial

| Plano | Preço | Periodicidade | Benefícios |
|---|---|---|---|
| Plano Essencial | R$ 89,90 | Mensal | 2 cortes por mês; 10% de desconto em produtos |
| Plano Premium | R$ 149,90 | Mensal | 4 cortes por mês; barba ilimitada; 20% de desconto |
| Plano Anual VIP | R$ 1.290,00 | Anual | Cortes ilimitados; barba ilimitada; horário prioritário; 30% de desconto |

---

## Telas

### Serviços e assinaturas (`/servicos` — cliente)

- **Sua assinatura** (quando existe): plano, valor, período de vigência, dias até
  a renovação, benefícios e botões **Renovar** e **Cancelar** (com confirmação).
- **Planos de assinatura**: cartões comparativos com botão **Assinar**, desabilitado
  e rotulado "Você já tem um plano" enquanto houver assinatura vigente.
- **Nossos serviços**: catálogo agrupado por categoria, com duração e preço.

### Planos de assinatura (`/admin/planos`)

Cartões com preço, periodicidade, número de assinantes ativos e benefícios.
**Editar** abre o formulário (benefícios em uma linha cada) e **Remover** avisa se
o plano será excluído ou apenas desativado.

---

## Observação sobre pagamentos

O módulo controla **vigência e benefícios**, não cobrança. Não há integração com
gateway de pagamento: `dataRenovacao` registra quando o plano vence, e a receita de
assinaturas aparece no relatório financeiro como linha **informativa** (planos
contratados no período), separada da receita de serviços. Uma integração de
cobrança recorrente entraria no `AssinaturaService`, no ponto em que hoje se chama
`contratar()` e `renovar()`.
