# Fase 3 — Decomposicao

**Projeto:** json-rest-server
**Versao:** 1.0
**Data:** 01/09/2026
**Autor:** Petrux-Architect
**Base:** Requisitos (Fase 1) + Analise (Fase 2)

---

## 1. Objetivo

Decompor o sistema em modulos, componentes e responsabilidades. Definir a estrutura de arquivos, contratos entre modulos e dependencias para implementacao (Fase 7).

---

## 2. Estrutura de Modulos

```
json-rest-server/
├── bin/
│   └── jrs.js                      # Entry point CLI (shebang + dispatch)
├── src/
│   ├── cli/
│   │   ├── index.js                # Commander: comandos create/run
│   │   ├── create.js               # Implementacao do comando create
│   │   └── run.js                  # Implementacao do comando run
│   ├── config/
│   │   ├── config-loader.js        # Le/valida config.yaml (js-yaml)
│   │   ├── config-defaults.js      # Valores padrao por campo (templates)
│   │   └── env.js                  # Overrides via process.env (PORT, HOST, etc.)
│   ├── db/
│   │   ├── database.js             # DatabaseRepository: load/getAll/getById/save/update/delete
│   │   ├── id-generator.js         # Gera id int (auto-inc) ou uuid v1
│   │   ├── persistence.js          # Save com debounce + escrita atomica (tmp+rename)
│   │   └── templates.js            # Database padrao (users, adm_users, products, categories)
│   ├── server/
│   │   ├── app.js                  # Fabrica do Express app (middlewares + rotas)
│   │   ├── json-rest-server.js     # Classe JsonRestServer (start, close)
│   │   └── routers/
│   │       ├── crud-router.js      # Rotas dinamicas :table/:id (GET/POST/PUT/PATCH/DELETE)
│   │       ├── auth-router.js      # POST /auth, PUT /auth/refresh
│   │       ├── me-router.js        # GET /me
│   │       ├── upload-router.js    # POST /uploads (multer)
│   │       └── storage-router.js   # GET /storage/* (static)
│   ├── middleware/
│   │   ├── cors.js                 # CORS liberado (headers Access-Control-*)
│   │   ├── auth.js                 # AuthMiddleware (token, urlSkip, admin, wildcard)
│   │   ├── mock-delay.js           # Header mock-delay → delay resposta
│   │   ├── logging.js              # Log de request (morgen) controlado por config
│   │   └── error-handler.js        # Tratamento padrao de erros (nao expoe stack)
│   ├── auth/
│   │   ├── jwt.js                  # JwtHelper: generateJWT, getClaims, refreshToken
│   │   └── password.js             # Comparacao texto-plano (compat original)
│   ├── broadcast/
│   │   ├── controller.js           # BroadCastController: dispara providers
│   │   ├── socket-provider.js      # TCP socket provider (net)
│   │   └── websocket-provider.js   # WebSocket provider (ws) na porta HTTP
│   ├── socket/
│   │   ├── tcp-server.js           # Servidor TCP (socketPort)
│   │   └── ws-server.js            # WebSocketServer upgrade no http server
│   └── util/
│       ├── logger.js               # Logger interno (verbose on/off)
│       └── paths.js                # Resolucao de caminhos (config dir)
├── config.yaml                     # Template criado pelo create
├── database.json                   # Template (ou vazio) criado pelo create
├── storage/                        # Pasta criada pelo create
├── templates/                      # Arquivos-templates usados pelo create
│   ├── config.yaml
│   └── database.json
├── test/
│   ├── helpers/
│   │   ├── temp-env.js             # Cria env temporario (config+database)
│   │   └── request.js              # Wrapper supertest
│   ├── unit/
│   │   ├── config-loader.test.js
│   │   ├── id-generator.test.js
│   │   ├── database.test.js
│   │   └── jwt.test.js
│   ├── integration/
│   │   ├── crud.test.js
│   │   ├── auth.test.js
│   │   ├── pagination.test.js
│   │   ├── upload.test.js
│   │   └── broadcast.test.js
│   └── cli/
│       ├── create.test.js
│       └── run.test.js
├── scripts/
│   ├── build-sea.js               # Build binario via Node SEA
│   └── postbuild.js               # Cria arquivos de config/assets
├── .github/workflows/
│   └── build.yml                  # CI: test + build matrix (win/mac/linux)
├── package.json
├── sea-config.json                 # Config do Node SEA
└── README.md
```

---

## 3. Decomposicao por Requisito

### 3.1 CLI (RF-001, RF-002, RF-023)

| Componente | Responsabilidade | Requisito |
|---|---|---|
| `cli/index.js` | Registrar comandos create/run no commander | RF-001, RF-002 |
| `cli/create.js` | Criar config.yaml, database.json, storage/ | RF-001, RF-024 |
| `cli/run.js` | Iniciar servidor (JsonRestServer.startServer) | RF-002 |
| `config/config-loader.js` | Ler config.yaml e mapear para objeto | RF-021 |
| `config/config-defaults.js` | Valores padrao por campo | RF-021 |
| `config/env.js` | Overrides PORT/HOST/DATABASE_PATH/JWT_SECRET | RF-022 |
| `util/logger.js` | Log via --verbose ou config | RF-023 |

### 3.2 CRUD (RF-003 a RF-010)

| Componente | Responsabilidade | Requisito |
|---|---|---|
| `db/database.js` | Repositorio: CRUD na memoria (copia do database.json) | RF-003 a RF-010 |
| `db/id-generator.js` | Gera id (int/uuid) seguindo idType | RF-007, RF-017 |
| `db/persistence.js` | Persiste com debounce 500ms + atomic write | RNF-003 |
| `server/routers/crud-router.js` | Roteamento dinamico por table | RF-003 a RF-010 |
| `middleware/pagination` (em crud-router) | page/limit com metadata | RF-005 |
| `middleware/filters` (em crud-router) | Filtro contains case-insensitive | RF-004 |

### 3.3 Auth (RF-011 a RF-014)

| Componente | Responsabilidade | Requisito |
|---|---|---|
| `auth/jwt.js` | Gerar/validar tokens; refresh token | RF-011, RF-012 |
| `auth/password.js` | Comparacao plaintext (compat original) | RF-011 |
| `server/routers/auth-router.js` | POST /auth, PUT /auth/refresh | RF-011, RF-012 |
| `server/routers/me-router.js` | GET /me | RF-013 |
| `middleware/auth.js` | Proteger rotas; urlSkip; wildcard; admin | RF-014 |
| `config/config-loader.js` | Carregar auth config (jwtSecret, etc.) | RF-021 |

### 3.4 Broadcast (RF-015, RF-016, RF-017)

| Componente | Responsabilidade | Requisito |
|---|---|---|
| `broadcast/controller.js` | Orquestra providers; payload {channel, table, data} | RF-015 |
| `broadcast/socket-provider.js` | Envia para clientes TCP | RF-017 |
| `broadcast/websocket-provider.js` | Envia para clientes WS (com filtro tables) | RF-016 |
| `socket/tcp-server.js` | Servidor TCP dedicado | RF-017 |
| `socket/ws-server.js` | WebSocket upgrade no http server | RF-016 |

### 3.5 Middleware transversal

| Componente | Responsabilidade | Requisito |
|---|---|---|
| `middleware/cors.js` | Headers CORS; resposta OPTIONS | RF-026 |
| `middleware/mock-delay.js` | Delay por header mock-delay | RF-018 |
| `middleware/logging.js` | Log de request (morgen) conditional | RF-023 |
| `middleware/error-handler.js` | Erro generico ao client; log detalhado | RNF-004 |

### 3.6 Static/Upload (RF-019, RF-020)

| Componente | Responsabilidade | Requisito |
|---|---|---|
| `server/routers/storage-router.js` | Serve arquivos de storage/ | RF-019 |
| `server/routers/upload-router.js` | POST /uploads via multer | RF-020 |

### 3.7 Build (RF-025)

| Componente | Responsabilidade | Requisito |
|---|---|---|
| `scripts/build-sea.js` | Executa Node SEA build | RF-025 |
| `.github/workflows/build.yml` | Matrix OS: win/mac(x64/arm64)/linux | RF-025 |
| `sea-config.json` | Config blob do SEA | RF-025 |

---

## 4. Contratos entre Modulos

### 4.1 DatabaseRepository (API interna)

```
load(basePath) → void                    // le database.json, inicializa memory map
tableExists(table) → boolean
getAll(table) → Array<Object>
getById(table, id) → Object | null
save(table, data) → Object               // cria ou atualiza (com debounce persist)
update(table, data) → Object | null      // data deve conter id; 404 se nao existe
delete(table, id) → void                 // remove (schedule persist)
flush() → void                           // force persist imediato (usado em close)
```

### 4.2 JwtHelper (API interna)

```
generateJWT(userId, admin) → string      // claim: iss='json_rest_server', sub, adm, iat, exp, nbf
getClaims(token) → object                // verificado; throw se invalido
refreshToken(accessToken) → string       // iss=accessToken, sub='RefreshToken', exp=7d, nbf=jwtExpire
validateRefresh(accessToken, refreshToken) → void
```

### 4.3 BroadcastController

```
execute(providers[], broadcastModel) → void
  // broadcastModel = { channel, table, data }
  // providers: ['socket', 'websocket']
  // socket: envia para clients TCP conectados
  // websocket: envia para clients WS (filtra por tables da query)
```

### 4.4 ConfigModel (objeto)

```
{
  name, port, host, database, idType,
  auth?: { jwtSecret, jwtExpire, unauthorizedStatusCode,
           enableAdm?, urlUserPermission?, urlSkip?, authFields? },
  enableSocket?, socketPort?, broadcastProvider?, slack?,
  storage?: { folder },
  log?: { level }
}
```

### 4.5 Auth middleware (headers injetados)

```
'user'        → id do usuario (de claims.sub)
'adm'         → 'true' | 'false'
'access_token' → token bruto validado
```

---

## 5. Dependencias (package.json)

```json
{
  "name": "json-rest-server",
  "version": "1.0.0",
  "dependencies": {
    "commander": "^12",
    "express": "^4",
    "js-yaml": "^4",
    "jsonwebtoken": "^9",
    "multer": "^1",
    "uuid": "^9",
    "ws": "^8",
    "cors": "^2"
  },
  "devDependencies": {
    "supertest": "^6"
  },
  "bin": {
    "json-rest-server": "bin/jrs.js",
    "jsonRestServer": "bin/jrs.js",
    "jrs": "bin/jrs.js"
  }
}
```

**Observacoes:**
- morgan opcional (log). Alternativa: logger proprio simples para reduzir dep.
- cors via pacote `cors` OU implementacao manual simples (menos 1 dep). **Decisao:** pacote `cors` (padrao, testado).
- Nenhuma dependencia nativa compilada → compativel com Node SEA.

---

## 6. Criterios de Decomposicao Satisfeitos

- [x] Cada modulo tem responsabilidade unica (SRP)
- [x] Modulos dependem de contratos (repositorio, jwt, broadcast), nao de implementacao
- [x] Toda funcionalidade mapeada para componentes
- [x] Zero dependencia nativa compilada (build SEA seguro)
- [x] Persistencia isolada com debounce (reversivel sem afetar CRUD)
- [x] Auth isolado (permite desabilitar sem tocar rotas CRUD)
- [x] Broadcast desacoplado via controller (permite adicionar slack no futuro)

---

## 7. Pendencia de Decisao

| Item | Opcao A | Opcao B | Recomendacao |
|---|---|---|---|
| Log de request | morgen (dep extra) | logger proprio (cerca de 15 linhas) | logger proprio — menos deps, controle de verbose |
| Upload de storage path | config.storage.folder | fixo ./storage | config com default ./storage |

**Decisao tomada nesta fase:** usar logger proprio simples (MUST: minimizar deps para SEA e para controle de verbose). Storage path configuravel com default `./storage`.

---

## 8. Aprovacao

**Aprovado por:** Pedro Conrad Junior
**Data:** ___/___/___
**Status:** Aguardando aprovacao