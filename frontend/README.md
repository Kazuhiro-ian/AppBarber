# AppBarber — Frontend

Interface React (Vite) do AppBarber. A documentação completa do projeto está na
raiz do repositório:

- [README principal](../README.md) — como rodar backend e frontend
- [docs/frontend.md](../docs/frontend.md) — telas, rotas, design system e padrões
- [docs/api.md](../docs/api.md) — referência dos endpoints consumidos aqui

## Comandos

```bash
npm install      # instala as dependências
npm run dev      # desenvolvimento em http://localhost:5173
npm run build    # build de produção em dist/
npm run preview  # serve o build localmente
npm run lint     # oxlint
```

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `/api` | URL base da API. Em desenvolvimento pode ficar vazia |
| `VITE_PROXY_TARGET` | `http://localhost:8080` | Destino do proxy de `/api` no dev server |

Copie `.env.example` para `.env` se precisar sobrescrever algo.
