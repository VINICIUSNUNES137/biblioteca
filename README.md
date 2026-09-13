# Biblioteca

Sistema local de gestão de acervo para o bibliotecário. Front em Next.js, API em Express e banco SQLite com Prisma — um repositório só.

## Entregas

O trabalho está quebrado em quatro fatias. Cada uma entra na `main` por merge da branch correspondente.

| Entrega | Branch | O que entra | Situação |
| --- | --- | --- | --- |
| 1. Cadastrar livros | `main` | Catálogo, capa, exemplares | **Na main** |
| 2. Cadastrar usuários | `entrega-2-usuarios` | CRUD de leitores e bibliotecários | Pronta para merge |
| 3. Emprestar e devolver | `entrega-3-emprestimos` | Empréstimo, prazo, multa, histórico, data de devolução | Pronta para merge |
| 4. Reservar e painel | `entrega-4-reservas-painel` | Fila de espera e números do acervo | Pronta para merge |

A ordem de merge é essa: livros → usuários → empréstimos → reservas/painel. Empréstimo precisa de leitor cadastrado; reserva e painel precisam do ciclo de empréstimo.

## Como rodar

Node 18+. Sem Docker. O banco é o arquivo `backend/prisma/dev.db`.

```bash
npm run primeiro-uso
npm run dev
```

- Front: http://localhost:3000
- API: http://localhost:3001

`primeiro-uso` instala as três pastas (`/` + `backend/` + `frontend/`), cria as tabelas e semeia o catálogo de demonstração.

Comandos soltos:

```bash
npm run setup      # instala dependências
npm run db:push    # cria/atualiza as tabelas
npm run db:seed    # dados de demonstração
npm run dev        # sobe API e Next juntos
```

Na entrega 1 o sistema assume a bibliotecária do seed (Carla Mendes) para as escritas. Não há login.

## Pastas

```
frontend/     Next.js — telas
backend/      Express — rotas, controllers, services
backend/prisma/schema.prisma
```

A regra de negócio fica em `backend/src/services/`. A URL da API existe só em `frontend/lib/api.js`.
