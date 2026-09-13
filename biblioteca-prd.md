# Sistema de gestão de biblioteca

**Documento de requisitos — projeto fullstack em 4 entregas**

`Next.js` · `Express` · `Prisma` · `MySQL` · 2 perfis · sem autenticação

Especificação das quatro entregas: comportamento esperado, regras de negócio, contrato da API e onde cada coisa é implementada. Cada entrega é uma fatia vertical — front, back e banco funcionando de ponta a ponta — e adiciona um verbo novo ao sistema.

---

## Sumário

1. [Escopo e perfis](#1-escopo-e-perfis)
2. [Arquitetura e pastas](#2-arquitetura-e-pastas)
3. [Convenções transversais](#3-convenções-transversais)
4. [Modelo de dados](#4-modelo-de-dados)
5. [Entrega 1 — Cadastrar](#5-entrega-1--cadastrar)
6. [Entrega 2 — Emprestar](#6-entrega-2--emprestar)
7. [Entrega 3 — Reservar](#7-entrega-3--reservar)
8. [Entrega 4 — Devolver](#8-entrega-4--devolver)
9. [Base visual](#9-base-visual)
10. [Fora de escopo](#10-fora-de-escopo)

---

## 1. Escopo e perfis

O sistema controla o acervo de uma biblioteca e o ciclo de vida do empréstimo: cadastrar títulos e suas cópias físicas, emprestar, reservar quando não há cópia livre, e devolver.

> **DECISÃO — Livro e exemplar são tabelas diferentes.**
> O acervo tem títulos; quem é emprestado é a cópia física. Sem essa separação não dá para saber qual cópia está com quem, nem marcar um exemplar danificado sem sumir com o título do catálogo. Custa uma tabela e uma chave estrangeira.

### Perfis

| Perfil | Pode | Não pode |
| --- | --- | --- |
| `LEITOR` | Consultar o acervo, ver a disponibilidade, reservar um livro sem exemplar livre, acompanhar os próprios empréstimos e reservas. | Cadastrar livros ou usuários, registrar empréstimo e devolução, ver o painel. |
| `BIBLIOTECARIO` | Tudo que o leitor faz, mais: cadastrar livros, exemplares e usuários, registrar empréstimo e devolução, ver atrasos e o painel. | — |

### As quatro entregas

| # | Verbo | Entrega | O que passa a existir |
| --- | --- | --- | --- |
| 01 | **Cadastrar** | Acervo e usuários | Tabelas `usuario`, `livro`, `exemplar`. Dois CRUDs e a busca no catálogo. |
| 02 | **Emprestar** | Saída do exemplar | Tabela `emprestimo`, prazo calculado e limite por leitor. O exemplar passa a ter situação. |
| 03 | **Reservar** | Fila de espera | Tabela `reserva`, com a posição calculada por ordem de chegada. |
| 04 | **Devolver** | Fechamento do ciclo | A volta do exemplar: libera ou atende a fila, calcula atraso e multa, bloqueia quem deve. |

> **ORDEM**
> A entrega 4 é onde tudo converge: a devolução libera o exemplar da entrega 2, atende a fila da entrega 3 e calcula o atraso comparando com `previstoPara`. Por isso ela depende de as datas terem sido gravadas desde o empréstimo — se a entrega 2 não registrar `emprestadoEm` e `previstoPara`, a última entrega deixa de ser possível sem remodelar o banco.

> **CONSEQUÊNCIA**
> Com a devolução na entrega 4, o sistema fica **de mão única durante as entregas 2 e 3**: empresta e reserva, mas não recebe de volta. É intencional e deve ser dito na apresentação, não escondido — para demonstrar essas etapas, recarregue o banco com `npm run db:seed`. Quem preferir fechar o ciclo mais cedo troca a ordem das entregas 3 e 4; o conteúdo de cada uma não muda.

---

## 2. Arquitetura e pastas

Um repositório só, com dois projetos dentro e um comando na raiz que sobe os dois. O back é Express em camadas; o front é Next.js consumindo a API por um único módulo.

```
biblioteca/
├── package.json              # só scripts: sobe backend e frontend juntos
├── README.md                 # como rodar, como semear o banco
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # o modelo inteiro num arquivo só
│   │   └── seed.js           # usuários e livros de exemplo
│   └── src/
│       ├── server.js         # cria o app, CORS, JSON, rotas, errorHandler
│       ├── prisma.js         # uma única instância do PrismaClient
│       ├── routes/           # só mapeia URL → controller
│       │   ├── usuario.routes.js
│       │   ├── livro.routes.js
│       │   ├── emprestimo.routes.js
│       │   ├── reserva.routes.js
│       │   └── painel.routes.js
│       ├── controllers/      # lê a requisição, chama o service, devolve status
│       ├── services/         # REGRA DE NEGÓCIO — é aqui que mora todo "não pode"
│       ├── middlewares/
│       │   ├── identificarUsuario.js
│       │   ├── exigirPerfil.js
│       │   └── errorHandler.js
│       └── erros/ErroDeNegocio.js
│
└── frontend/
    ├── app/
    │   ├── layout.js         # cabeçalho + seletor de "quem sou eu"
    │   ├── livros/page.js
    │   ├── livros/[id]/page.js
    │   ├── emprestimos/page.js
    │   ├── minhas-reservas/page.js
    │   ├── usuarios/page.js
    │   └── painel/page.js
    ├── components/           # Botao, Tabela, Lozenge, Campo, Modal
    └── lib/api.js            # ÚNICO lugar que conhece a URL do backend
```

### O que cada camada faz

| Camada | Responsabilidade | O que nunca faz |
| --- | --- | --- |
| `routes` | Declara método e caminho, encadeia middlewares e aponta para um método do controller. Idealmente uma linha por rota. | Não valida, não consulta o banco. |
| `controllers` | Lê `req.params`, `req.body` e `req.usuario`, chama o service e responde com o status certo. | Não contém `if` de regra de negócio nem chama o Prisma. |
| `services` | Toda a regra: verifica disponibilidade, calcula prazo, muda situação, lança `ErroDeNegocio`. É a camada que se testa. | Não conhece `req` nem `res`. |
| `prisma` | Acesso ao banco, migrations e o modelo declarado no `schema.prisma`. | Não decide nada. |

> **MVC**
> É MVC com a view destacada: o **Model** é o `schema.prisma` mais os services, o **Controller** é a pasta `controllers/`, e a **View** é o projeto Next, que roda separado e fala com o back por HTTP. Vale saber explicar isso na apresentação — é a pergunta mais provável sobre a arquitetura.

> **ALTERNATIVA**
> Se a disciplina exigir *models escritos à mão* (classes numa pasta `models/`), troque Prisma por **Sequelize**. Muda só a camada de dados: routes, controllers e services continuam idênticos. O Prisma foi escolhido porque o `schema.prisma` é um arquivo único que se lê como o próprio DER, e as migrations saem de um comando.

### Script da raiz

```json
"scripts": {
  "dev": "concurrently \"npm --prefix backend run dev\" \"npm --prefix frontend run dev\"",
  "db:migrate": "npm --prefix backend run prisma migrate dev",
  "db:seed": "npm --prefix backend run seed"
}
```

---

## 3. Convenções transversais

### Identidade sem autenticação

Não há login. O cabeçalho do front tem um seletor de usuário, guardado no `localStorage`, e o `lib/api.js` envia o id em todas as requisições no header `x-usuario-id`. No back, um middleware carrega o usuário e o coloca em `req.usuario`; outro exige perfil quando a rota é restrita.

```js
// backend/src/middlewares/identificarUsuario.js
module.exports = async (req, res, next) => {
  const id = Number(req.headers['x-usuario-id'])
  if (!id) return next(new ErroDeNegocio('SEM_USUARIO', 'Selecione um usuário.', 400))
  req.usuario = await prisma.usuario.findUnique({ where: { id } })
  if (!req.usuario) return next(new ErroDeNegocio('USUARIO_INVALIDO', 'Usuário não encontrado.', 404))
  next()
}

// uso na rota — leitura é livre, escrita de acervo é do bibliotecário
router.get('/livros', controller.listar)
router.post('/livros', exigirPerfil('BIBLIOTECARIO'), controller.criar)
```

> **LIMITE**
> Isso **não** é segurança — qualquer um pode trocar o header. É controle de fluxo, e serve ao propósito do trabalho. Diga isso na apresentação antes de perguntarem: mostra que a escolha foi consciente, não ingênua.

### Formato de erro

Todo erro de regra sai do service como `ErroDeNegocio(codigo, mensagem, status)` e é convertido pelo `errorHandler` num corpo único. O front sempre sabe onde ler a mensagem.

```json
{ "erro": { "codigo": "EXEMPLAR_INDISPONIVEL",
            "mensagem": "Este exemplar já está emprestado." } }
```

| Status | Quando usar | Exemplo neste sistema |
| --- | --- | --- |
| `400` | Dados faltando ou inválidos | Cadastrar livro sem título |
| `403` | Perfil não permite a ação | Leitor tentando registrar empréstimo |
| `404` | Registro não existe | Exemplar com id inexistente |
| `409` | Existe, mas o estado não permite | Emprestar exemplar já emprestado |

### Situações e transições

Situação nunca é texto livre: é `ENUM` no banco e só muda por ação. O front nunca envia a situação — ele chama a ação e recebe o resultado.

| Entidade | De | Para | Disparado por |
| --- | --- | --- | --- |
| `exemplar` | DISPONIVEL | EMPRESTADO | Registrar empréstimo |
| `exemplar` | EMPRESTADO | DISPONIVEL | Devolver, sem reserva na fila |
| `exemplar` | EMPRESTADO | RESERVADO | Devolver, com reserva aguardando |
| `exemplar` | RESERVADO | EMPRESTADO | Reserva retirada pelo leitor |
| `reserva` | AGUARDANDO | ATENDIDA | Devolução libera um exemplar |
| `reserva` | AGUARDANDO | CANCELADA | Leitor cancela |

---

## 4. Modelo de dados

Estado final, ao fim da entrega 4. Os campos marcados com `// e2`, `// e3` e `// e4` só passam a ser usados naquela entrega — mas criar as colunas desde o início evita alterar tabela com dados dentro.

```prisma
enum Perfil           { LEITOR BIBLIOTECARIO }
enum SituacaoExemplar { DISPONIVEL EMPRESTADO RESERVADO INDISPONIVEL }
enum SituacaoReserva  { AGUARDANDO ATENDIDA CANCELADA }

model Usuario {
  id          Int       @id @default(autoincrement())
  nome        String
  email       String    @unique
  perfil      Perfil    @default(LEITOR)
  criadoEm    DateTime  @default(now())
  emprestimos Emprestimo[]
  reservas    Reserva[]
}

model Livro {
  id         Int        @id @default(autoincrement())
  titulo     String
  autor      String
  isbn       String     @unique
  ano        Int
  criadoEm   DateTime   @default(now())
  exemplares Exemplar[]
  reservas   Reserva[]                    // e3 — reserva-se o título, não a cópia
}

model Exemplar {
  id          Int              @id @default(autoincrement())
  codigo      String           @unique    // tombo, ex.: "EX-0042"
  situacao    SituacaoExemplar @default(DISPONIVEL)
  livroId     Int
  livro       Livro            @relation(fields: [livroId], references: [id])
  criadoEm    DateTime         @default(now())
  emprestimos Emprestimo[]
}

model Emprestimo {
  id           Int       @id @default(autoincrement())
  exemplarId   Int
  exemplar     Exemplar  @relation(fields: [exemplarId], references: [id])
  leitorId     Int
  leitor       Usuario   @relation(fields: [leitorId], references: [id])
  emprestadoEm DateTime  @default(now())
  previstoPara DateTime                   // emprestadoEm + 14 dias
  devolvidoEm  DateTime?                  // nulo = empréstimo ativo
  multa        Decimal?  @db.Decimal(6,2) // e4

  @@index([leitorId])
  @@index([devolvidoEm])
}

model Reserva {                            // e3
  id         Int             @id @default(autoincrement())
  livroId    Int
  livro      Livro           @relation(fields: [livroId], references: [id])
  leitorId   Int
  leitor     Usuario         @relation(fields: [leitorId], references: [id])
  situacao   SituacaoReserva @default(AGUARDANDO)
  criadoEm   DateTime        @default(now())
  atendidaEm DateTime?

  @@index([livroId, situacao, criadoEm])   // a fila é lida por ordem de chegada
}
```

> **POR QUÊ**
> `devolvidoEm` nulo é o que define "empréstimo ativo" — não existe campo `status` no empréstimo. Uma informação, um lugar. O mesmo vale para disponibilidade: quem responde é `exemplar.situacao`, não uma contagem no livro.

---

## 5. Entrega 1 — Cadastrar

**Verbo: cadastrar · Acervo e usuários**

> Como bibliotecário, quero cadastrar títulos e as cópias físicas de cada um, para que o catálogo reflita o que a biblioteca realmente tem na estante.

### Fluxo esperado

1. O bibliotecário abre `/livros` e vê o catálogo com um campo de busca por título, autor ou ISBN.
2. Cadastra um livro informando título, autor, ISBN e ano.
3. Abre o detalhe do livro e adiciona exemplares, um por vez, cada um com seu código de tombo.
4. A lista do catálogo mostra, para cada título, quantos exemplares existem e quantos estão disponíveis.
5. Em `/usuarios`, cadastra leitores e bibliotecários escolhendo o perfil no formulário.

### Regras de negócio

- **RN-1.1** — Título, autor, ISBN e ano são obrigatórios. ISBN é único no acervo.
- **RN-1.2** — O código do exemplar é único no sistema inteiro, não só dentro do livro.
- **RN-1.3** — Todo exemplar nasce `DISPONIVEL`. O formulário não oferece a situação.
- **RN-1.4** — Livro com exemplares não pode ser excluído — a exclusão devolve `409` sugerindo excluir os exemplares antes.
- **RN-1.5** — E-mail do usuário é único. O perfil só pode ser `LEITOR` ou `BIBLIOTECARIO`.

### Contrato da API

| Método e rota | Corpo | Resposta |
| --- | --- | --- |
| `GET /livros?busca=` | — | `200` lista com `totalExemplares` e `disponiveis` |
| `GET /livros/:id` | — | `200` livro com seus exemplares |
| `POST /livros` | `{ titulo, autor, isbn, ano }` | `201` livro criado |
| `PUT /livros/:id` | mesmos campos | `200` |
| `DELETE /livros/:id` | — | `204` ou `409` |
| `POST /livros/:id/exemplares` | `{ codigo }` | `201` |
| `DELETE /exemplares/:id` | — | `204` ou `409` se emprestado |
| `GET POST PUT DELETE /usuarios` | `{ nome, email, perfil }` | CRUD padrão |

### Implementação

| Arquivo | O que contém |
| --- | --- |
| `routes/livro.routes.js` | As 7 rotas de livro e exemplar, com `exigirPerfil('BIBLIOTECARIO')` nas de escrita. |
| `controllers/livro.controller.js` | Um método por rota: extrai parâmetros, chama o service, devolve `201`/`200`/`204`. |
| `services/livro.service.js` | Validação dos campos, checagem de ISBN duplicado, bloqueio da exclusão com exemplares, e o cálculo de `disponiveis` na listagem. |
| `app/livros/page.js` | Tabela do catálogo, campo de busca com *debounce*, botão "Novo livro". |
| `app/livros/[id]/page.js` | Dados do título e a tabela de exemplares com a situação em lozenge. |
| `lib/api.js` | `get`, `post`, `put`, `del` — todos já enviando `x-usuario-id` e traduzindo o corpo de erro. |

### Critério de aceite

Cadastrar um livro com dois exemplares, recarregar a página e ver "2 exemplares · 2 disponíveis" na listagem. Tentar cadastrar outro livro com o mesmo ISBN devolve erro tratado na tela, não tela branca.

---

## 6. Entrega 2 — Emprestar

**Verbo: emprestar · Registro de empréstimo**

> Como bibliotecário, quero registrar a saída de um exemplar com prazo de devolução, para que o sistema sempre saiba qual cópia está com quem e até quando.

### Fluxo esperado

1. No detalhe do livro, o bibliotecário clica em **Emprestar** num exemplar disponível.
2. Escolhe o leitor numa lista e confirma. O sistema calcula o prazo automaticamente.
3. O exemplar passa a `EMPRESTADO` e some da contagem de disponíveis do catálogo.
4. O empréstimo aparece em `/emprestimos` com a data prevista de devolução.
5. O leitor, com o próprio perfil selecionado, vê o que está com ele e até quando.

### Regras de negócio

- **RN-2.1** — Só se empresta exemplar com situação `DISPONIVEL`. Qualquer outra devolve `409`.
- **RN-2.2** — O prazo é de **14 dias** a partir do empréstimo. O valor fica numa constante em `services/emprestimo.service.js`, nunca espalhado pelo código nem vindo do front.
- **RN-2.3** — Um leitor tem no máximo **3 empréstimos ativos** (com `devolvidoEm` nulo).
- **RN-2.4** — A criação do empréstimo e a mudança de situação do exemplar acontecem na **mesma transação**. Se uma falhar, nenhuma vale — senão sobra exemplar marcado como emprestado sem empréstimo nenhum.
- **RN-2.5** — `previstoPara` é calculado no back e gravado na criação. O front nunca envia data.

> **NÃO PULE**
> **Gravar `emprestadoEm` e `previstoPara` é o ponto crítico do projeto inteiro.** É de onde a entrega 4 tira atraso, multa e tempo médio. Um empréstimo que só marca o exemplar como emprestado faz esta entrega funcionar e a última morrer.

> **ESCOPO**
> Esta entrega **não** devolve. O campo `devolvidoEm` já existe na tabela e fica nulo — é ele que define "empréstimo ativo" nas consultas. A ação de devolver chega na entrega 4.

### Contrato da API

| Método e rota | Corpo | Resposta |
| --- | --- | --- |
| `POST /emprestimos` | `{ exemplarId, leitorId }` | `201` com `previstoPara` calculado |
| `GET /emprestimos?ativos=true` | — | `200` lista com livro, exemplar e leitor |
| `GET /emprestimos?leitor=:id` | — | `200` histórico do leitor |

### Implementação

```js
// services/emprestimo.service.js — o coração da entrega
const PRAZO_DIAS = 14
const LIMITE_ATIVOS = 3

async function emprestar({ exemplarId, leitorId }) {
  const exemplar = await prisma.exemplar.findUnique({ where: { id: exemplarId } })
  if (!exemplar) throw new ErroDeNegocio('EXEMPLAR_NAO_ENCONTRADO', 'Exemplar não existe.', 404)
  if (exemplar.situacao !== 'DISPONIVEL')
    throw new ErroDeNegocio('EXEMPLAR_INDISPONIVEL', 'Este exemplar não está disponível.', 409)

  const ativos = await prisma.emprestimo.count({ where: { leitorId, devolvidoEm: null } })
  if (ativos >= LIMITE_ATIVOS)
    throw new ErroDeNegocio('LIMITE_ATINGIDO', `Leitor já tem ${LIMITE_ATIVOS} empréstimos ativos.`, 409)

  // as duas escritas precisam valer juntas
  return prisma.$transaction(async (tx) => {
    await tx.exemplar.update({ where: { id: exemplarId }, data: { situacao: 'EMPRESTADO' } })
    return tx.emprestimo.create({
      data: { exemplarId, leitorId, previstoPara: emDias(PRAZO_DIAS) }
    })
  })
}
```

### Critério de aceite

Emprestar um exemplar e ver a contagem de disponíveis do catálogo cair de 2 para 1. Tentar emprestar o mesmo exemplar de novo e receber "Este exemplar não está disponível" na tela. Emprestar um quarto livro ao mesmo leitor e ser barrado pelo limite.

---

## 7. Entrega 3 — Reservar

**Verbo: reservar · Fila de espera**

> Como leitor, quero entrar na fila de um livro cujas cópias estão todas emprestadas, para ser o próximo quando alguma voltar.

### Fluxo esperado

1. O leitor abre um livro sem exemplar disponível e vê o botão **Reservar** no lugar da indicação de disponibilidade.
2. Ao reservar, entra na fila e a tela mostra sua posição ("3º na fila").
3. Em `/minhas-reservas`, acompanha a posição e pode cancelar.
4. O bibliotecário abre o detalhe do livro e vê a fila inteira, em ordem de chegada, com nome e data de cada reserva.

### Regras de negócio

- **RN-3.1** — Só se reserva livro sem *nenhum* exemplar disponível. Havendo cópia livre, a resposta é `409` orientando a pegar emprestado.
- **RN-3.2** — O mesmo leitor não tem duas reservas `AGUARDANDO` para o mesmo livro.
- **RN-3.3** — Quem já está com um exemplar daquele livro emprestado não pode reservá-lo.
- **RN-3.4** — A fila é por ordem de `criadoEm`, sem prioridade. A posição é calculada, nunca gravada — gravar posição obriga a renumerar a fila inteira a cada cancelamento.
- **RN-3.5** — Cancelar só vale em reserva `AGUARDANDO`, e só pelo próprio leitor ou por um bibliotecário.
- **RN-3.6** — A reserva é do **título**, não de um exemplar. Qual cópia atenderá a fila só se sabe na devolução, na entrega 4.

### Contrato da API

| Método e rota | Corpo | Resposta |
| --- | --- | --- |
| `POST /reservas` | `{ livroId }` (leitor vem do header) | `201` com `posicao` |
| `GET /reservas?leitor=:id` | — | `200` com posição de cada uma |
| `GET /livros/:id/reservas` | — | `200` fila em ordem (bibliotecário) |
| `DELETE /reservas/:id` | — | `204` |

### Implementação

Um arquivo novo (`services/reserva.service.js`) e nenhuma alteração nos anteriores. O detalhe que decide a qualidade da entrega é **não gravar a posição na fila**: ela é contada na leitura. Posição gravada precisa ser renumerada a cada cancelamento, e é onde a fila silenciosamente se corrompe.

```js
// services/reserva.service.js
async function reservar({ livroId, leitorId }) {
  const disponiveis = await prisma.exemplar.count({
    where: { livroId, situacao: 'DISPONIVEL' }
  })
  if (disponiveis > 0)
    throw new ErroDeNegocio('HA_EXEMPLAR_LIVRE',
      'Há exemplar disponível — faça o empréstimo em vez de reservar.', 409)

  const jaTem = await prisma.reserva.findFirst({
    where: { livroId, leitorId, situacao: 'AGUARDANDO' }
  })
  if (jaTem) throw new ErroDeNegocio('RESERVA_DUPLICADA', 'Você já está na fila deste livro.', 409)

  return prisma.reserva.create({ data: { livroId, leitorId } })
}

// a posição é contada, nunca gravada
async function posicaoNaFila(reserva) {
  return 1 + await prisma.reserva.count({
    where: { livroId: reserva.livroId, situacao: 'AGUARDANDO',
             criadoEm: { lt: reserva.criadoEm } }
  })
}
```

### Critério de aceite

Com todos os exemplares emprestados, dois leitores diferentes reservam o mesmo livro e veem as posições 1 e 2. O primeiro cancela, e o segundo passa a ver posição 1 sem que nada tenha sido renumerado no banco. Com um exemplar disponível, o botão de reservar não aparece.

---

## 8. Entrega 4 — Devolver

**Verbo: devolver · A volta do exemplar**

> Como bibliotecário, quero registrar a devolução de um exemplar e que o sistema decida sozinho o que fazer com ele, para que a estante, a fila de reservas e a situação do leitor fiquem corretas sem conferência manual.

> **POR QUE ESTA É A ÚLTIMA**
> A devolução é o único ponto do sistema em que todas as regras se encontram: ela fecha o empréstimo da entrega 2, decide o destino do exemplar consultando a fila da entrega 3, e compara a data com o prazo para apurar atraso. Não é uma tela a mais — é o fechamento do ciclo.

### Fluxo esperado

1. Em `/emprestimos`, o bibliotecário vê os empréstimos ativos, com os vencidos marcados como `ATRASADO` e os dias de atraso.
2. Clica em **Devolver**. O sistema grava a data da volta e fecha o empréstimo.
3. Se existe reserva na fila daquele título, o exemplar vai para `RESERVADO` e a tela informa para quem ele está separado. Se não existe, volta para `DISPONIVEL` e reaparece no catálogo.
4. Havendo atraso, a multa é calculada e exibida na confirmação.
5. Enquanto tiver empréstimo vencido em aberto, o leitor não consegue novo empréstimo nem nova reserva — e a tela diz exatamente por quê.

### Regras de negócio

- **RN-4.1** — Só é devolvido empréstimo ativo (`devolvidoEm` nulo). Devolver duas vezes devolve `409`.
- **RN-4.2** — A devolução grava `devolvidoEm` *e* muda a situação do exemplar *e*, se for o caso, atende a reserva — tudo na **mesma transação**. Se uma falhar, nenhuma vale.
- **RN-4.3** — O destino do exemplar depende da fila: havendo reserva `AGUARDANDO` para aquele título, ele vai para `RESERVADO` e a reserva mais antiga vira `ATENDIDA`; não havendo, vai para `DISPONIVEL`.
- **RN-4.4** — Atraso é **calculado**, nunca gravado como situação: `devolvidoEm == null && previstoPara < hoje`. Guardar "está atrasado" no banco obriga a rodar algo todo dia para manter a verdade.
- **RN-4.5** — Multa = dias de atraso × `VALOR_DIA` (constante no service). Gravada em `emprestimo.multa` no momento da devolução, porque aí o valor congela.
- **RN-4.6** — Leitor com ao menos um empréstimo atrasado é bloqueado: `POST /emprestimos` e `POST /reservas` devolvem `409` com o código `LEITOR_BLOQUEADO`.
- **RN-4.7** — O bloqueio some sozinho quando o atraso é regularizado — é consequência do estado, não um campo que alguém precisa lembrar de desmarcar.

### Extensão opcional — painel

Não é requisito desta entrega, mas com as datas já gravadas cada indicador abaixo é um `count` ou um `groupBy`. É a tela que melhor se apresenta numa banca, e a primeira coisa a cortar se o prazo apertar.

| Indicador | De onde sai |
| --- | --- |
| **Emprestados agora** | `count` de empréstimos com `devolvidoEm` nulo |
| **Em atraso** | o mesmo, com `previstoPara < hoje` |
| **Tempo médio de empréstimo** | média de `devolvidoEm - emprestadoEm` nos devolvidos |
| **Livros mais emprestados** | `groupBy` em `exemplar.livroId`, ordenado por contagem |
| **Leitores bloqueados** | leitores distintos com empréstimo atrasado |
| **Fila de reservas** | `count` de reservas `AGUARDANDO` por livro |

### Contrato da API

| Método e rota | Resposta |
| --- | --- |
| `POST /emprestimos/:id/devolver` | `200` `{ devolvidoEm, diasAtraso, multa, exemplar: { situacao }, reservaAtendida }` |
| `GET /emprestimos?atrasados=true` | `200` com `diasAtraso` e `multaPrevista` em cada item |
| `GET /usuarios/:id/situacao` | `200` `{ bloqueado, pendencias[] }` |
| `GET /painel/resumo` | `200` com os indicadores num objeto *(opcional)* |

### Implementação

Nenhuma tabela nova. Entra o `devolver()` no service de empréstimo, e os services de empréstimo e reserva ganham **uma linha no começo**: `await garantirLeitorLiberado(leitorId)`. Uma função, dois pontos de uso — é assim que a regra de bloqueio não se duplica.

```js
// services/emprestimo.service.js
const VALOR_DIA = 0.50

async function devolver(id) {
  const emp = await prisma.emprestimo.findUnique({
    where: { id }, include: { exemplar: true }
  })
  if (!emp) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Empréstimo não existe.', 404)
  if (emp.devolvidoEm)
    throw new ErroDeNegocio('JA_DEVOLVIDO', 'Este empréstimo já foi encerrado.', 409)

  const agora = new Date()
  const diasAtraso = Math.max(0, diffEmDias(agora, emp.previstoPara))
  const multa = diasAtraso * VALOR_DIA

  return prisma.$transaction(async (tx) => {
    await tx.emprestimo.update({
      where: { id }, data: { devolvidoEm: agora, multa }
    })

    // a fila da entrega 3 decide o destino do exemplar
    const proxima = await tx.reserva.findFirst({
      where: { livroId: emp.exemplar.livroId, situacao: 'AGUARDANDO' },
      orderBy: { criadoEm: 'asc' }
    })

    if (proxima) {
      await tx.reserva.update({ where: { id: proxima.id },
        data: { situacao: 'ATENDIDA', atendidaEm: agora } })
    }

    await tx.exemplar.update({ where: { id: emp.exemplarId },
      data: { situacao: proxima ? 'RESERVADO' : 'DISPONIVEL' } })

    return { devolvidoEm: agora, diasAtraso, multa, reservaAtendida: proxima ?? null }
  })
}

// chamada no início de emprestar() e de reservar()
async function garantirLeitorLiberado(leitorId) {
  const atrasados = await prisma.emprestimo.count({
    where: { leitorId, devolvidoEm: null, previstoPara: { lt: new Date() } }
  })
  if (atrasados > 0)
    throw new ErroDeNegocio('LEITOR_BLOQUEADO',
      `Há ${atrasados} empréstimo(s) em atraso. Regularize para continuar.`, 409)
}
```

### Critério de aceite

Três verificações, nesta ordem:

1. Devolver um exemplar sem fila: ele volta para o catálogo como disponível.
2. Devolver um exemplar com dois leitores na fila: ele fica reservado, a reserva da posição 1 sai de aguardando, e a posição 2 vira 1.
3. Com um empréstimo vencido no seed, o leitor aparece em atraso, é barrado ao tentar pegar outro livro com o motivo na tela, e depois de devolver a multa aparece calculada e o bloqueio some sozinho.

---

## 9. Base visual

A interface segue o vocabulário do design system da Atlassian. São poucos componentes, reaproveitados em todas as telas, o que mantém o front pequeno e consistente.

| Token | Valor | Uso |
| --- | --- | --- |
| azul primário | `#0052CC` | Botão principal, links, foco |
| texto | `#172B4D` | Títulos e corpo |
| texto secundário | `#44546F` | Apoio, rótulos de tabela |
| borda | `#DFE1E6` | Cartões, tabelas, campos |
| fundo da página | `#F7F8F9` | Fora dos cartões |
| raio | `3px` | Tudo. Sem cantos muito arredondados. |
| grade | múltiplos de `8px` | Espaçamentos e alturas |

### Situação sempre em lozenge

Estado nunca é só texto: é a etiqueta colorida que dá para ler de relance numa tabela cheia. A cor é semântica e constante em todo o sistema.

| Etiqueta | Cor | Significa |
| --- | --- | --- |
| `DISPONIVEL` | verde | Exemplar na estante, pode ser emprestado |
| `EMPRESTADO` | amarelo | Com um leitor, dentro do prazo |
| `RESERVADO` | azul | Separado para o primeiro da fila |
| `ATRASADO` | vermelho | Prazo vencido e não devolvido |
| `INDISPONIVEL` | cinza | Danificado ou em manutenção |

### Componentes do front

- `Botao` — variantes primário, sutil e perigo.
- `Tabela` — cabeçalho fixo, estado vazio com mensagem ("Nenhum livro cadastrado ainda").
- `Lozenge` — recebe a situação e resolve a cor sozinho.
- `Campo` — rótulo, input, texto de ajuda e mensagem de erro no mesmo componente.
- `Modal` — usado para emprestar e para confirmar exclusões.
- `Aviso` — o painel colorido de informação, alerta e erro.

---

## 10. Fora de escopo

Declarado de propósito, para não virar discussão no meio do semestre nem promessa na apresentação:

- **Autenticação com senha** — o seletor de usuário cumpre o papel.
- **Renovação de empréstimo** — é o primeiro candidato caso sobre tempo; a regra seria "não renova com atraso, no máximo duas vezes".
- **Notificação por e-mail** quando a reserva é atendida — a tela do leitor mostra.
- **Prazo de retirada da reserva** — o exemplar fica reservado por tempo indeterminado.
- **Pagamento da multa** — o valor é calculado e exibido, não quitado no sistema.
- **Relatórios exportáveis** em PDF ou planilha.

---

> **ORDEM DE CORTE**
> Se o prazo apertar: primeiro o painel da entrega 4, depois o cancelamento de reserva, depois o limite de empréstimos por leitor — nunca `emprestadoEm` e `previstoPara` na entrega 2, que são o que torna a entrega 4 possível.
