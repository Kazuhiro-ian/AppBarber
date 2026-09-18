# Módulo: Autenticação e perfis de acesso

Cadastro, login, sessão JWT, perfil da conta e as regras de quem enxerga o quê.

**Backend:** `AuthController`, `AuthService`, `JwtService`, `JwtAuthenticationFilter`,
`UsuarioDetailsService`, `UsuarioAutenticado`, `UsuarioLogado`, `SecurityConfig`
**Frontend:** `pages/auth/Login.jsx`, `pages/auth/CriarConta.jsx`, `pages/Perfil.jsx`,
`context/AuthContext.jsx`, `components/RotaProtegida.jsx`, `services/api.js`

---

## Funcionalidades

### 1. Criar conta (auto-cadastro de cliente)

Qualquer visitante pode criar uma conta, que nasce sempre como **CLIENTE**.

- E-mail é normalizado (`trim` + minúsculas) e precisa ser único.
- Validação de formato tanto no frontend quanto no backend (`Usuario.validarEmail`).
- Senha entre 6 e 72 caracteres, gravada como hash **BCrypt**.
- Contas de **BARBEIRO** ou **ADMIN** só podem ser criadas por um ADMIN autenticado:
  se um anônimo enviar `tipoUsuario: "ADMIN"`, a requisição é recusada com HTTP 400.
- O cadastro já devolve o token — o usuário entra direto, sem passar pelo login.

### 2. Login

- Autenticação por e-mail + senha, comparada com o hash BCrypt.
- Credencial inválida devolve **401** com a mesma mensagem genérica
  ("E-mail ou senha inválidos"), sem revelar se o e-mail existe.
- A resposta traz `token`, `tipo` (`Bearer`), `expiraEmSegundos` e os dados do usuário.

### 3. Sessão JWT

- Token assinado em **HS512**, com os claims `sub` (e-mail), `iss`, `id`, `nome`,
  `tipoUsuario`, `iat` e `exp`. Validade padrão de 24 h.
- O `JwtAuthenticationFilter` lê o header `Authorization: Bearer <token>`, valida a
  assinatura e popula o `SecurityContext`. Token inválido ou expirado simplesmente
  não autentica — a requisição segue como anônima e cai no 401 do endpoint protegido.
- O segredo precisa ter no mínimo 32 caracteres; a aplicação recusa subir com um
  segredo menor.
- No frontend, o token fica no `localStorage`; o interceptor do Axios o injeta em
  toda requisição. Um **401** fora da tela de login limpa a sessão e redireciona
  para `/login?expirada=1`.
- O `AuthContext` reidrata a sessão no primeiro render e confirma o token com
  `GET /api/auth/eu`.

### 4. Perfil da conta

Vale para os três perfis:

- Atualizar nome, telefone e URL da foto de perfil (campos nulos são ignorados).
- Trocar a senha informando a senha atual — se ela não conferir, HTTP 400.
- O e-mail de acesso não é editável por esta tela.
- Encerrar sessão (limpa o token do navegador).

### 5. Controle de acesso por perfil

Duas camadas, ambas obrigatórias:

- **Backend (fonte de verdade):** regras de URL no `SecurityConfig` +
  `@PreAuthorize` nos controllers + verificações de posse no service (por exemplo,
  um cliente só remarca o próprio agendamento).
- **Frontend (experiência):** `RotaProtegida` evita que a tela sequer apareça e
  `RotaPublica` manda quem já está logado para a home do seu perfil.

| Área | CLIENTE | BARBEIRO | ADMIN |
|---|:--:|:--:|:--:|
| Agendar / meus agendamentos | ✅ | — | ✅ (em nome do cliente) |
| Agenda do dia e concluir atendimento | — | ✅ | ✅ |
| Serviços (leitura) | ✅ | ✅ | ✅ |
| Serviços (escrita) | — | — | ✅ |
| Estoque (consulta e baixa) | — | ✅ | ✅ |
| Estoque (cadastro, edição, entrada, exclusão) | — | — | ✅ |
| Assinatura própria | ✅ | — | — |
| Planos (catálogo, escrita) | — | — | ✅ |
| Despesas e gestão financeira | — | — | ✅ |
| Clientes e barbeiros (gestão) | — | — | ✅ |

---

## Endpoints

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/registrar` | público | Cria conta (CLIENTE por padrão) e devolve o token |
| `POST` | `/api/auth/login` | público | Autentica e devolve o token |
| `GET` | `/api/auth/eu` | autenticado | Dados do usuário do token |
| `PUT` | `/api/auth/perfil` | autenticado | Atualiza nome, telefone e foto |
| `PATCH` | `/api/auth/senha` | autenticado | Troca a senha (204 em caso de sucesso) |

### Exemplo — login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@appbarber.com","senha":"admin123"}'
```

```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "tipo": "Bearer",
  "expiraEmSegundos": 86400,
  "usuario": {
    "id": 1,
    "nome": "Administrador",
    "email": "admin@appbarber.com",
    "telefone": "(11) 90000-0000",
    "tipoUsuario": "ADMIN"
  }
}
```

---

## Validações

| Campo | Regra |
|---|---|
| `nome` | obrigatório, até 120 caracteres |
| `email` | obrigatório, formato válido, único, até 150 caracteres |
| `senha` | obrigatória, de 6 a 72 caracteres |
| `telefone` | opcional, até 20 caracteres |
| `fotoPerfil` | opcional, até 500 caracteres |
| `senhaAtual` | obrigatória ao trocar a senha, e precisa conferir |

---

## Erros

Todas as falhas passam pelo `GlobalExceptionHandler` e voltam no mesmo formato:

```json
{
  "timestamp": "2026-09-17T00:30:32.36",
  "status": 400,
  "erro": "Bad Request",
  "mensagem": "Há campos inválidos na requisição",
  "caminho": "/api/auth/registrar",
  "campos": { "senha": "A senha deve ter entre 6 e 72 caracteres" }
}
```

| Situação | HTTP |
|---|---|
| Campos inválidos (Bean Validation) | 400 + mapa `campos` |
| Violação de regra de negócio | 400 |
| Credenciais inválidas / sem token | 401 |
| Perfil sem permissão | 403 |
| Recurso inexistente | 404 |
| Erro inesperado | 500 (detalhe só no log do servidor) |

---

## Segurança — notas de produção

- Defina `BARBER_JWT_SECRET` por variável de ambiente (mínimo 32 caracteres).
- Troque as senhas das contas de demonstração criadas pela migration V2.
- Ajuste `BARBER_CORS_ORIGINS` para o domínio real do frontend.
- A API é *stateless* (sem sessão HTTP) e CSRF está desabilitado — o que é correto
  para uma API consumida por token, mas significa que o token **não** deve ser
  guardado em cookie sem as devidas proteções.
