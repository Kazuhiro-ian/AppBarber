# AppBarber — Sistema de Agendamento para Barbearia

Aplicação web responsiva de agendamento e gestão para barbearia, com três perfis de
usuário (**CLIENTE**, **BARBEIRO** e **ADMIN**), API REST em Spring Boot e frontend em
React. Funciona igualmente bem no navegador do celular (bottom navigation) e no
desktop (sidebar completa).

---

## Sumário

- [Stack](#stack)
- [Como rodar](#como-rodar)
- [Contas de demonstração](#contas-de-demonstração)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Módulos e documentação](#módulos-e-documentação)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Testes](#testes)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 8, React Router 7, Axios, CSS próprio (mobile-first) |
| Backend | Java 25 + Spring Boot 4.1 (Web MVC, Data JPA, Security, Validation) |
| Autenticação | JWT (HS512) com controle de acesso por `tipoUsuario` |
| Banco | PostgreSQL 17, migrations com Flyway |
| Arquitetura | `controller → service → repository`, DTOs separados das entidades JPA |

---

## Como rodar

### Pré-requisitos

- **JDK 21+** (o projeto está compilando com Java 25)
- **Node.js 20+**
- **PostgreSQL 14+** — ou Docker, para subir o banco pelo `docker-compose.yml`

### Opção rápida — tudo via Docker

```bash
docker compose up --build
```

Sobe PostgreSQL, backend e frontend juntos, lendo as variáveis do `.env` da raiz.
O backend fica em **http://localhost:8080** (ou na porta de `BARBER_SERVER_PORT`) e o
frontend, com hot reload, em **http://localhost:5173** (ou na porta de
`BARBER_FRONTEND_PORT`). Não precisa de JDK nem Node instalados na máquina — só
Docker. Os passos abaixo (1 a 3) são para rodar cada parte manualmente, fora do
Docker.

### 1. Banco de dados

**Opção A — Docker (mais rápido):**

```bash
docker compose up -d
```

Sobe um PostgreSQL em `localhost:55432` com banco/usuário/senha `appbarber`.

**Opção B — PostgreSQL já instalado:**

```bash
createdb -U postgres appbarber
```

As tabelas e a carga inicial são criadas automaticamente pelo Flyway no primeiro
start do backend — não é preciso rodar nenhum script à mão.

### 2. Backend

Com o Docker (opção A):

```bash
cd backend && BARBER_DB_URL=jdbc:postgresql://localhost:55432/appbarber BARBER_DB_USERNAME=appbarber BARBER_DB_PASSWORD=appbarber ./mvnw spring-boot:run
```

Com o PostgreSQL local (opção B), ajuste apenas a senha:

```bash
cd backend && BARBER_DB_PASSWORD=sua_senha ./mvnw spring-boot:run
```

No Windows (PowerShell), defina as variáveis antes de chamar o wrapper:

```bash
cd backend; $env:BARBER_DB_PASSWORD='sua_senha'; .\mvnw.cmd spring-boot:run
```

A API sobe em **http://localhost:8080**.

### 3. Frontend

```bash
cd frontend && npm install && npm run dev
```

A aplicação abre em **http://localhost:5173**. O Vite já encaminha `/api` para o
backend em `localhost:8080`, então não é preciso configurar nada para desenvolver.

Se o backend estiver em outra porta:

```bash
cd frontend && VITE_PROXY_TARGET=http://localhost:8081 npm run dev
```

### 4. Build de produção

```bash
cd backend && ./mvnw clean package
```

```bash
cd frontend && npm run build
```

O frontend gera `frontend/dist/`. Em produção, defina `VITE_API_URL` com a URL
pública da API (ou sirva os arquivos atrás de um proxy que encaminhe `/api`).

---

## Contas de demonstração

Criadas pela migration `V2__dados_iniciais.sql`. **Troque as senhas antes de ir
para produção.**

| Perfil | E-mail | Senha |
|---|---|---|
| ADMIN | `admin@appbarber.com` | `admin123` |
| BARBEIRO | `carlos@appbarber.com` | `barbeiro123` |
| BARBEIRO | `rafael@appbarber.com` | `barbeiro123` |
| CLIENTE | `joao@email.com` | `cliente123` |

A tela de login tem atalhos que preenchem essas credenciais.

---

## Estrutura do projeto

```
AppBarber/
├── backend/
│   └── src/main/java/com/barber/app/
│       ├── config/       # SecurityConfig, CORS, propriedades do JWT
│       ├── controller/   # endpoints REST
│       ├── domain/       # entidades JPA + regras de negócio do domínio
│       ├── dto/          # contratos de entrada e saída da API
│       ├── exception/    # tratamento global (@RestControllerAdvice)
│       ├── repository/   # Spring Data JPA
│       ├── security/     # filtro JWT, UserDetails, usuário autenticado
│       └── service/      # regras de aplicação e transações
│   └── src/main/resources/db/migration/   # migrations Flyway (V1, V2, V3)
├── frontend/
│   └── src/
│       ├── components/   # UI reutilizável (ui/) e layout (layout/)
│       ├── context/      # AuthContext e ToastContext
│       ├── hooks/        # useAuth, useToast, useCarregar
│       ├── pages/        # telas por perfil (auth/, cliente/, barbeiro/, admin/)
│       ├── services/     # cliente HTTP e um módulo por recurso da API
│       ├── styles/       # tokens, layout responsivo e componentes
│       └── utils/        # formatação pt-BR e configuração do menu
├── docs/                 # documentação de cada módulo
└── docker-compose.yml    # PostgreSQL para desenvolvimento
```

---

## Módulos e documentação

Cada módulo tem um documento com regras de negócio, endpoints, telas e validações:

| Módulo | Documento |
|---|---|
| Visão geral e modelagem do domínio | [docs/modelagem.md](docs/modelagem.md) |
| Autenticação e perfis de acesso | [docs/autenticacao.md](docs/autenticacao.md) |
| Agendamentos | [docs/agendamentos.md](docs/agendamentos.md) |
| Barbeiros | [docs/barbeiros.md](docs/barbeiros.md) |
| Serviços | [docs/servicos.md](docs/servicos.md) |
| Assinaturas e planos | [docs/assinaturas.md](docs/assinaturas.md) |
| Clientes | [docs/clientes.md](docs/clientes.md) |
| Estoque de produtos | [docs/estoque.md](docs/estoque.md) |
| Despesas | [docs/despesas.md](docs/despesas.md) |
| Gestão financeira | [docs/financeiro.md](docs/financeiro.md) |
| Frontend: telas, rotas e design | [docs/frontend.md](docs/frontend.md) |
| Referência rápida da API | [docs/api.md](docs/api.md) |

---

## Variáveis de ambiente

### Backend

| Variável | Padrão | Descrição |
|---|---|---|
| `BARBER_DB_URL` | `jdbc:postgresql://localhost:5432/appbarber` | URL JDBC do PostgreSQL |
| `BARBER_DB_USERNAME` | `postgres` | Usuário do banco |
| `BARBER_DB_PASSWORD` | `postgres` | Senha do banco |
| `BARBER_SERVER_PORT` | `8080` | Porta da API |
| `BARBER_JWT_SECRET` | chave de desenvolvimento | Segredo HMAC — **mínimo 32 caracteres**; obrigatório em produção |
| `BARBER_JWT_EXPIRACAO_MS` | `86400000` (24 h) | Validade do token |
| `BARBER_CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Origens liberadas, separadas por vírgula |
| `BARBER_LOG_SQL` | `INFO` | Use `DEBUG` para ver o SQL gerado |

### Frontend

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `/api` | URL base da API. Em dev pode ficar vazia (o proxy resolve) |
| `VITE_PROXY_TARGET` | `http://localhost:8080` | Destino do proxy de desenvolvimento |

---

## Testes

```bash
cd backend && ./mvnw test
```

33 testes cobrindo as regras do domínio (agendamento, estoque, assinatura,
comissão) e o serviço de agendamento contra um banco H2 em memória — não é
preciso ter PostgreSQL rodando para executá-los.

```bash
cd frontend && npm run lint
```
