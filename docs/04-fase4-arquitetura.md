# Fase 4 — Arquitetura

**Projeto:** json-rest-server
**Versao:** 1.0
**Data:** 01/09/2026
**Autor:** Petrux-Architect
**Base:** Requisitos (Fase 1), Analise (Fase 2), Decomposicao (Fase 3)

---

## 1. Visao Arquitetural

Arquitetura **Layered (camadas)** leve e pragmatica, adaptada ao porte do projeto:

```
┌─────────────────┐
│   CLI Layer     │  bin/jrs.js, commands (create/run)
├─────────────────┤
│   HTTP Layer    │  app.js, routers, middleware (Express)
├─────────────────┤
│ Service/Domain  │  auth/jwt, auth/password, broadcast/controller
├─────────────────┤
│ Repository      │  db/database, db/id-generator, db/persistence
├─────────────────┤
│ Persistence     │  database.json (fs, atomic write + debounce)
└─────────────────┘
```

Principios aplicados (kiss/yagni, proporcional ao risco):
- **Dependency Inversion**: routers dependem de DatabaseRepository e JwtHelper via injecao simples (constructor/context object), nao de singletons globais (get_it do Dart e substituido por injeção manual).
- **Single Responsibility**: cada modulo tem uma funcao (ver Fase 3).
- **Open/Closed**: BroadcastController permite adicionar providers (ex.: slack futuro) sem alterar o controller.
- **Separation of Concerns**: middlewares transversais (cors, auth, delay, log, erro) separados das rotas.

**Anti-pattern evitado:** nao usar um DI container (get_it). O escopo pequeno justifica injecao manual via um objeto de contexto unico (`AppContext`).

---

## 2. Contexto de Aplicacao (AppContext)

Objeto unico injetado em todos os modulos que precisam de estado compartilhado:

```
AppContext {
  config,                 // ConfigModel carregado
  database,               // DatabaseRepository instanciado
  jwt,                    // JwtHelper (config-aware)
  logger,                 // Logger (verbose on/off)
  broadcast,              // BroadCastController
  paths,                  // { baseDir, configPath, databasePath, storageFolder }
  env,                    // overrides process.env aplicados
  httpServer,             // ref opcional (para close)
  tcpServer,              // ref opcional (para close)
  wsServer                // ref opcional (para close)
}
```

Construido em `server/json-rest-server.js` no `startServer()`. Passado como parametro (constructor) para routers e middlewares.

---

## 3. Fluxo de Request REST

```
Request HTTP
   │
   ├─ [1] Express raw body / route (multer para /uploads)
   │
   ├─ [2] mock-delay middleware       (header → delay se presente)
   │
   ├─ [3] cors middleware             (headers CORS + preflight OPTIONS)
   │
   ├─ [4] logging middleware          (metodo, path, status, duracao) se verbose
   │
   ├─ [5] auth middleware            (se config.auth ativo; urlSkip/wildcard/admin)
   │        └─ injeta req.user, req.adm, req.accessToken
   │
   ├─ [6] crud-router (rota :table/:id)
   │        ├─ GET  list     → filtro + paginacao (metadata se ?page)
   │        ├─ GET  :id      → getById
   │        ├─ POST          → save (id gerado; #userAuthRef substituido)
   │        ├─ PUT/PATCH :id → update (404 se nao existe)
   │        └─ DELETE :id    → delete (200 sempre — compat)
   │
   ├─ [7] apos verbo de escrita → broadcast.execute(...)
   │
   ├─ [8] error-handler (catch final)
   │        └─ nunca expoe stack; loga internamente
   │
   └─ Response JSON
```

### Rotas especiais (fora do crud-router)

| Rota | Router | Comportamento |
|---|---|---|
| `POST /auth` | auth-router | login (users/adm_users; authFields) |
| `PUT /auth/refresh` | auth-router | refresh token |
| `GET /me` | me-router | dados do usuario logado (sem password) |
| `POST /uploads` | upload-router | multipart via multer → storage |
| `GET /storage/*` | storage-router | static files, sem auth |

---

## 4. Auth Flow

### 4.1 Login (POST /auth)
```
body { email, password, [admin] }
  → users = admin ? adm_users : users
  → se users vazio → 500 'user table not exists'
  → valida:
      - padrao: email + password iguais (plaintext)
      - authFields: valida campo a campo (string/int/double)
  → invalido → forbidden (status unauthorizedStatusCode, padrao 403)
  → gera access_token (jwt HS256, claims: iss, sub, adm, iat, exp, nbf)
  → gera refresh_token (exp 7d, nbf = jwtExpire, iss = access_token)
  → responde { access_token, refresh_token, type: 'Bearer' }
```

### 4.2 Refresh (PUT /auth/refresh)
```
header: Authorization Bearer <access>
body:   { refresh_token }
  → valida refresh com issuer = access_token
  → claims do access (sub, adm)
  → novos tokens
  → erro: refresh invalido / ainda nao valido (resp com error_description)
```

### 4.3 Protecao de rota (middleware)
```
se path vazio ('/') ou OPTIONS          → passa
se ultimo segmento == 'auth'            → login (deixa passar p/ router)
se PUT e path termina em /auth/refresh  → passa
se config.auth nulo  ou path começa com 'storage' → passa

senão:
  urlSkip match (literal ou wildcard {*})? → passa
  authHeader ausente / nao Bearer?        → unauthorizedStatusCode (403 default)
  claims validas?                         → senao 403
  métodos write + enableAdm:
       adm==true ou url em urlUserPermission? → passa, senão 403
  injeta req.user, req.adm, req.access_token
```

### 4.4 /me
```
id = req.user (sub do token)
idType int → int.parse(id); uuid → id (string)
table = adm ? 'adm_users' : 'users'
result = database.getById(table, id)
remove 'password'
responde result
```

---

## 5. Camada de Dados

### 5.1 Database - mesmo schema do Dart original

```json
{
  "users": [ { "id": 1, "email": "...", "password": "..." } ],
  "adm_users": [ ... ],
  "products": [ ... ]
}
```

### 5.2 Persistencia com debounce

```
Estrategia:
1. database.json carregado na memoria no start
2. toda mutacao atualiza a memoria e agenda flush (debounce 500ms)
3. flush: valida JSON, escreve em <database>.tmp, renomeia para <database>
   (escrita atomica, evita corrupcao)
4. no close/flush forçado → escreve imediatamente
5. operacoes com timeout de flush para nao perder dados em exit
```

### 5.3 Gerador de ID

```
idType int  → ultimo id (numerico) da tabela + 1
              se encontrar string → erro de conflito (mensagem: idType mudou)
idType uuid → uuid.v1()
              se encontrar int → erro de conflito
```

---

## 6. Broadcast

### 6.1 TCP Socket (socketPort dedicado)
```
Servidor net identificado no start se enableSocket
socketPort != port HTTP (senão mensagem de erro + exit)
Clientes conectados recebem JSON: { channel, table, data }
Broadcast: controller verifica clientes conectados; se nenhum, nao envia
```

### 6.2 WebSocket (mesma porta HTTP)
```
Upgrade na conexao com a rota base (path nao REST)
query ?tables=a,b → filtro exclusivo; sem tables → recebe tudo
Payload: { channel, table, data }
Aplicado em POST, PUT, PATCH, DELETE
```

### 6.3 Controller (extensivel)
```
execute(providers, broadcastModel)
  for provider in providers:
    provider.send(broadcastModel)
  providers disponiveis: socket-provider, websocket-provider
  futuros: slack-provider
```

---

## 7. Tratamento de Erros

Formato de erro padronizado (mantendo campos 'error'/'erro' do original onde necessario):

| Caso | Status | Body |
|---|---|---|
| Table inexistente (GET/POST) | 404 | `{ "erro": "resource not found" }` |
| POST body invalido (json malformado) | 400 | `{ "error": "invalid json body" }` |
| ID inexistente (GET by id) | 200 | `{}` (compat) |
| PUT/PATCH id inexistente | 404 | `{ "erro": "resource not found" }` |
| DELETE id inexistente | 200 | `{}` (compat) |
| Conflito de tipo de ID | 409 | `{ "erro": "<msg>" }` |
| Auth invalido/ausente | 403 (default) | vazio (body opcional) |
| Campo authFields ausente no body | 500 | mensagem explicativa |
| Rotas nao suportadas | 405 | `{ "error": "Unsupported request: X." }` |
| Erro interno | 500 | `{ "error": "Internal server error" }` (detalhe so no log) |

Principio: **nunca expor stack trace** ao client. Log completo no logger interno.

---

## 8. Configuracao

### 8.1 Esquema do config.yaml (compativel 1:1 com Dart)

```yaml
name: Json Rest Server
port: 8080
host: 0.0.0.0
database: database.json
idType: int            # int | uuid
enableSocket: true
socketPort: 8081
broadcastProvider: socket   # socket | (futuro) slack
storage:
  folder: storage/
slack:
  slackUrl: ''
  slackChannel: ''
# log:
#   level: debug       # off | basic | debug (futuro; MVP: --verbose flag)
# auth:
#   jwtSecret: ...
#   jwtExpire: 3600
#   unauthorizedStatusCode: 403
#   enableAdm: false
#   urlUserPermission:
#     - /users
#   urlSkip:
#     - /users:
#         method: post
#   authFields:
#     - matricula:
#         type: int
```

### 8.2 Precedencia (maior → menor)

```
1. Env vars (PORT, HOST, DATABASE_PATH, JWT_SECRET)
2. Arquivo config.yaml
3. Defaults internos
```

---

## 9. Componentes e Restricoes para SEA

- Stack 100% JS puro (sem native module) → export de binario via Node SEA sem blob de native.
- Assets embutidos no SEA: templates de `config.yaml` e `database.json` (strings no codigo ou blob).
- Ao rodar como binário SEA, `paths.baseDir` = diretorio onde o binario roda (nao o diretorio do snapshot).
- `create`/`run` usam `process.cwd()` como base (comportamento esperado de CLI).

---

## 10. Decisoes Arquiteturais (ADRs)

### ADR-001: Injecao manual (AppContext) em vez de DI container
**Contexto:** original usava get_it (singletons globais).
**Decisao:** injecao manual por constructor/AppContext.
**Consequencias:** menos magia, facil de testar (mokar context), sem dep extra. Trade-off: passar context explicitamente em routers.

### ADR-002: Persistencia com debounce + atomic write
**Contexto:** original gravava em disco a cada operacao (File.writeAsStringSync).
**Decisao:** memoria + flush 500ms + tmp+rename.
**Consequencias:** ganho de performance, menor risco de corrupcao. Trade-off: stop dispendio de memoria temporaria.

### ADR-003: POST e DELETE mantem status 200
**Contexto:** convencao REST sugere 201/204; original usa 200.
**Decisao:** manter 200 (compatibilidade).
**Consequencias:** clients existentes do Dart continuam funcionando. Documentado.

### ADR-004: Paginacao com metadata apenas com ?page
**Contexto:** original retornava subarray.
**Decisao:** `?page` → `{ data, total, page, limit, totalPages }`; sem `?page` → array puro.
**Consequencias:** ganho sem quebrar clientes. Documentado.

### ADR-005: Senha em texto plano
**Contexto:** decisao de produto (dev/teste).
**Decisao:** manter plaintext no database.json.
**Consequencias:** aviso no README/run de que e para dev/teste, nao producao.

---

## 11. Checklist de Arquitetura

- [x] Camadas definidas com responsabilidades claras
- [x] Injecao de dependencia via AppContext (DIP)
- [x] Fluxo de request mapeado completo
- [x] Fluxo de auth mapeado completo
- [x] Persistencia segura (debounce + atomic write)
- [x] Broadcast desacoplado e extensivel
- [x] Tratamento de erros padronizado sem exposicao de stack
- [x] Compatibilidade config.yaml 1:1 com Dart
- [x] Restricao de SEA respeitada (zero native modules)
- [x] ADRs documentando decisoes

---

## 12. Aprovacao

**Aprovado por:** Pedro Conrad Junior
**Data:** ___/___/___
**Status:** Aguardando aprovacao