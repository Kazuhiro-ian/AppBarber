# Frontend: telas, rotas e design

React 19 + Vite, React Router 7 e CSS próprio. Mobile-first: o CSS padrão vale
para o celular e os breakpoints acrescentam o comportamento de desktop.

---

## Organização

```
src/
├── components/
│   ├── layout/AppLayout.jsx     # topbar + sidebar (desktop) + bottom nav (mobile)
│   ├── ui/                      # Botao, Campo, Cartao, Modal, Avatar, Barra, Estados
│   └── RotaProtegida.jsx        # guarda de rota por autenticação e perfil
├── context/
│   ├── AuthContext.jsx          # sessão, login, logout, reidratação do token
│   └── ToastContext.jsx         # notificações de sucesso/erro
├── hooks/
│   ├── useAuth.js
│   ├── useToast.js
│   └── useCarregar.js           # carregamento + erro + recarregar()
├── pages/
│   ├── auth/                    # Login, CriarConta
│   ├── cliente/                 # HomeCliente, AgendarHorario, MeusAgendamentos, ServicosAssinaturas
│   ├── barbeiro/                # PainelBarbeiro, AgendaDia, PerfilBarbeiro
│   ├── admin/                   # PainelAdmin, AgendaGeral, Clientes, GestaoServicos,
│   │                            #  GestaoBarbeiros, GestaoPlanos, GestaoEstoque,
│   │                            #  GestaoDespesas, GestaoFinanceira
│   ├── Perfil.jsx               # comum aos três perfis
│   └── NaoEncontrada.jsx
├── services/                    # api.js (Axios) + um módulo por recurso
├── styles/                      # theme.css, layout.css, components.css
└── utils/                       # formato.js (pt-BR), navegacao.js (menus)
```

---

## Rotas

| Rota | Tela | Perfil |
|---|---|---|
| `/login` | Login | público (redireciona quem já entrou) |
| `/criar-conta` | Criar conta | público |
| `/` | Home do cliente | CLIENTE |
| `/agendar` | Agendar horário | CLIENTE |
| `/meus-agendamentos` | Meus agendamentos | CLIENTE |
| `/servicos` | Serviços e assinaturas | CLIENTE |
| `/perfil` | Perfil da conta | todos |
| `/barbeiro` | Painel do barbeiro | BARBEIRO |
| `/barbeiro/agenda` | Agenda do dia | BARBEIRO |
| `/barbeiro/estoque` | Estoque (consulta e baixa) | BARBEIRO |
| `/barbeiro/perfil` | Perfil profissional | BARBEIRO |
| `/admin` | Painel da barbearia | ADMIN |
| `/admin/agenda` | Agenda geral | ADMIN |
| `/admin/clientes` | Clientes | ADMIN |
| `/admin/servicos` | Serviços | ADMIN |
| `/admin/barbeiros` | Barbeiros | ADMIN |
| `/admin/planos` | Planos de assinatura | ADMIN |
| `/admin/estoque` | Gestão de estoque | ADMIN |
| `/admin/despesas` | Despesas | ADMIN |
| `/admin/financeiro` | Gestão financeira | ADMIN |

Após o login, cada perfil vai para sua rota inicial: CLIENTE → `/`,
BARBEIRO → `/barbeiro`, ADMIN → `/admin`. Um usuário que digite uma rota de outro
perfil é redirecionado para a própria home (`RotaProtegida`).

---

## Navegação responsiva

O menu de cada perfil está em `utils/navegacao.js` e alimenta **as duas**
navegações a partir da mesma fonte.

### Celular (< 1024px)

- Topbar enxuta: logo, avatar e botão Sair.
- **Bottom navigation** fixa com até 4 atalhos (`principal: true`) + botão **Mais**.
- O botão "Mais" abre uma folha inferior com o restante do menu — é o que permite
  ao ADMIN ter 10 itens sem espremer a barra.
- Respeita `env(safe-area-inset-bottom)` em aparelhos com barra de gestos.

### Desktop (≥ 1024px)

- **Sidebar** fixa, com o menu agrupado por seção (no ADMIN: Operação, Cadastros,
  Gestão, Conta).
- Topbar mostra também nome e perfil do usuário.
- Bottom navigation some.

---

## Design system

Tokens em `styles/theme.css` (tema escuro, carvão + dourado):

| Grupo | Tokens |
|---|---|
| Superfícies | `--cor-fundo`, `--cor-superficie`, `--cor-superficie-2/3`, `--cor-borda` |
| Texto | `--cor-texto`, `--cor-texto-suave`, `--cor-texto-fraco` |
| Marca | `--cor-marca`, `--cor-marca-clara/escura/suave` |
| Status | `--cor-sucesso`, `--cor-aviso`, `--cor-erro`, `--cor-info` (+ variantes suaves) |
| Forma | `--raio-sm`, `--raio`, `--raio-lg`, `--raio-full`, `--sombra` |
| Layout | `--largura-sidebar`, `--altura-topbar`, `--altura-bottomnav` |

Componentes em `styles/components.css`: `.card`, `.stat`, `.btn` (com variantes
`primario`, `contorno`, `perigo`, `sucesso`, `texto`), `.campo`, `.badge`, `.item`,
`.tabela`, `.grade-horarios`, `.opcao`, `.modal`, `.vazio`, `.toast`, `.barra-*`.

Detalhes de acessibilidade e uso: foco visível (`:focus-visible`), respeito a
`prefers-reduced-motion`, modais fecháveis com **Esc** e com `role="dialog"`,
toasts em `aria-live="polite"`, tabelas com rolagem horizontal no celular.

---

## Padrões adotados

### Carregamento de dados

`useCarregar(fn, deps)` concentra o trio carregando/erro/dados e devolve
`recarregar()` — usado depois de toda ação que altera dados:

```jsx
const { dados, carregando, erro, recarregar } = useCarregar(
  () => produtoService.listar(),
  [],
)

if (carregando) return <Carregando />
if (erro) return <Erro mensagem={erro} onTentarNovamente={recarregar} />
```

### Mensagens de erro

O interceptor do Axios (`services/api.js`) traduz o `ErroResponse` do backend em
`erro.mensagem`, já pronta para a tela — inclusive escolhendo a primeira mensagem
do mapa `campos` quando a falha é de validação. As telas só exibem
`e.mensagem`.

### Ações destrutivas

Cancelar agendamento, inativar serviço, excluir produto ou despesa, remover plano
e cancelar assinatura sempre passam por `<Confirmacao>`, que explica a consequência
antes de confirmar.

### Formatação

`utils/formato.js` centraliza moeda (`R$ 1.234,56`), datas (`17/09/2026`,
`Quinta-feira, 17 de setembro`), horas (`14:30`), duração (`1h30`) e os rótulos de
status. As datas são montadas em horário local para evitar o deslocamento de fuso
que o `Date` aplica a strings ISO.

---

## Comunicação com a API

- Base: `VITE_API_URL` ou `/api`. Em desenvolvimento, o proxy do Vite encaminha
  `/api` para o backend e remove o header `Origin`, para que o CORS não dependa da
  porta em que o dev server estiver rodando.
- Um módulo por recurso em `services/`, cada função devolvendo direto `response.data`.
- Token injetado automaticamente; **401** fora do login limpa a sessão e volta para
  `/login?expirada=1`.
- Acesso ao `localStorage` é sempre protegido por `try/catch` (navegação anônima ou
  armazenamento bloqueado não quebram a aplicação).

---

## Build e verificação

```bash
npm run dev      # desenvolvimento em http://localhost:5173
npm run build    # gera dist/
npm run preview  # serve o build localmente
npm run lint     # oxlint
```
