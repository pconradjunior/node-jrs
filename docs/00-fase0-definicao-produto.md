# Fase 0 — Definicao do Produto

**Projeto:** json-rest-server (Node.js)
**Versao:** 1.0.0
**Data:** 2026-09-01
**Base:** Port do `json_rest_server` (Dart, Rodrigo Rahman) para Node.js

---

## 1. Visao Geral

Servidor RESTful local baseado em JSON, distribuido como executavel standalone multiplataforma. Ferramenta para desenvolvedores mobile/web criarem um backend mock/mock-real rapidamente, com autenticacao JWT, paginacao, filtros, upload de arquivos e broadcast em tempo real — tudo persistindo em um simples `database.json`.

## 2. Problema que Resolve

Desenvolvedores mobile (Flutter, React Native, etc.) precisam de um backend funcional durante o desenvolvimento, mas:
- Configurar um servidor real (Node, Python, etc.) consome tempo
- Servicos como JSONServer nao tem auth, upload, broadcast
- Solucoes como Mockoon/Postman Mock sao limitadas em CRUD dinamico
- Querem algo `plug-and-play` que rode como CLI

## 3. Publico-alvo

- Desenvolvedores Flutter/React Native em fase de prototipacao
- Equipes que precisam de backend mock para testes integrados
- Hackathons e prototipos rapidos
- Educacao (ensino de integracao frontend-backend)

## 4. Proposta de Valor

> "Tenha um servidor RESTful 100% funcional com autenticacao, paginacao e upload — em 30 segundos, sem banco de dados."

## 5. Funcionalidades do Produto (Mapeamento Completo)

### 5.1 Funcionalidades Essenciais (MVP)

| # | Funcionalidade | Descricao |
|---|---|---|
| F01 | CLI `create` | Gera estrutura inicial (config.yaml + database.json com dados padrao) |
| F02 | CLI `run` | Inicia o servidor com as configuracoes do config.yaml |
| F03 | CRUD REST automatico | Rotas geradas a partir das chaves do database.json |
| F04 | GET com filtros | Query params `?field=value` para busca em qualquer campo |
| F05 | GET com paginacao | `?page=1&limit=10` |
| F06 | GET by ID | `GET /table/:id` |
| F07 | POST | Criacao de registros |
| F08 | PUT/PATCH | Atualizacao de registros |
| F09 | DELETE | Remocao de registros |
| F10 | JWT Auth | Login, access_token, refresh_token (7 dias) |
| F11 | Auth Fields customizados | Config de campos de login (email/password ou custom) |
| F12 | Admin users | Collection `adm_users` + login admin |
| F13 | Rota `/me` | Dados do usuario logado (sem password) |
| F14 | URL Skip | Rotas/metodos que nao precisam de auth |
| F15 | Wildcard `{*}` | Coringa em urlSkip para ignorar partes da URL |
| F16 | `#userAuthRef` | Tag substituida pelo id do usuario autenticado |
| F17 | ID types | Suporte a `int` (auto-incremento) ou `uuid` |
| F18 | Mock delay | Header `mock-delay: N` para simular timeout |
| F19 | Static files | Pasta `storage/` serve arquivos estaticos |
| F20 | Upload | `POST /uploads` com multipart/form-data |
| F21 | Config YAML | Arquivo config.yaml para todas as configuracoes |
| F22 | Executavel standalone | Binario multiplataforma sem necessidade de Node.js |

### 5.2 Funcionalidades de Broadcast (MVP)

| # | Funcionalidade | Descricao |
|---|---|---|
| F23 | Socket TCP broadcast | Servidor TCP na porta separada, eventos por canal |
| F24 | WebSocket broadcast | Servidor WebSocket na mesma porta REST |
| F25 | Filtro por tabela (WS) | `?tables=users,products` no WebSocket |
| F26 | Socket channel custom | Header `socket-channel` para escolher canal |

### 5.3 Funcionalidades Futuras (Pos-MVP)

| # | Funcionalidade | Justificativa |
|---|---|---|
| F27 | Slack integration | Menos usada, manter como plugin opcional |
| F28 | CLI `upgrade` | Atualizacao via npm e mais simples que CLI proprio |
| F29 | CLI `version` | Comando trivial, pos-implantar |
| F30 | CORS configuravel | Por padrao ja funciona, config extras no futuro |
| ~~F31~~ | ~~Middleware de log~~ | ~~Ja tem logRequests nativo, melhorar depois~~ — **MOVIDO PARA MVP** |
| F32 | Healthcheck endpoint | `GET /health` — util mas nao bloqueante |
| F33 | Rate limiting | Protecao contra abuso, importante mas nao MVP |
| F34 | HTTPS/TLS | Para uso em rede real, nao necessario em dev local |

---

## 6. Melhorias Propostas Sobre o Original

### 6.1 Seguranca

| Problema no Original | Melhoria |
|---|---|
| Senhas em texto plano no JSON | Manter texto plano (ambiente de dev/teste, nao producao) |
| JWT sem validacao robusta | Usar `jsonwebtoken` com validacao completa |
| Sem protecao contra brute force | Adicionar rate limiting no login |
| Error messages expoe stack trace | Erros genericos ao usuario, log interno controlavel via flag `--verbose` ou config |

### 6.2 Performance

| Problema no Original | Melhoria |
|---|---|
| Database lido em memoria, salvo em disco a cada operacao | Debounce no save (evitar I/O a cada POST/PUT/DELETE) |
| Filtro por `retainWhere` em array inteiro | Indexacao em memoria para buscas frequentes |
| Paginacao com subarray | Paginacao eficiente com metadata (total, page, limit, totalPages) |
| Broadcast em loop para todos os clients | Filtragem eficiente por订阅 |

### 6.3 API/UX

| Problema no Original | Melhoria |
|---|---|
| Resposta 415 para conflito de ID | Usar 409 Conflict (HTTP correto) |
| Resposta vazia para tabela nao encontrada | Mensagem de erro explicita |
| GET all retorna array sem metadata | Incluir metadata de paginacao |
| Filtro so suporta `contains` | Suportar `eq`, `ne`, `gt`, `lt`, `gte`, `lte` via query params |
| Sem ordenacao | Adicionar `?_sort=field&_order=asc` |
| Sem busca por multiplos valores | Adicionar `?field=in val1,val2` |

### 6.4 Developer Experience

| Problema no Original | Melhoria |
|---|---|
| Sem suporte a env vars | Porta, DB path e auth secret via `process.env` |
| Sem hot reload no dev | `--watch` flag para reiniciar automaticamente |
| Sem verbose mode | Flag `--verbose` para logs detalhados |
| Sem healthcheck | `GET /health` para verificar se o server esta rodando |

### 6.5 Build/Distribuicao

| Problema no Original | Melhoria |
|---|---|
| Depende de Dart runtime | Node SEA = binario standalone |
| So distribui via pub.dev | npm + GitHub Releases com binarios |
| Sem Docker image | Container para ambientes CI/CD |

---

## 7. Fluxos Principais

### 7.1 Setup Inicial
```
Usuário → executa `json-rest-server create`
  → Cria config.yaml com valores padrao
  → Cria database.json com dados padrao:
      - users: 2 usuarios (admin + comum)
      - adm_users: 1 admin
      - products: 5-10 produtos de exemplo
      - categories: 4-6 categorias de exemplo
  → Cria pasta storage/ vazia
  → Exibe instrucoes de uso
```

### Database.json Padrao (criado no `create`)

**users** (2 registros):
```json
{
  "id": 1,
  "name": "Admin User",
  "email": "admin@admin.com",
  "password": "123"
}
```
```json
{
  "id": 2,
  "name": "Common User",
  "email": "user@user.com",
  "password": "123"
}
```

**adm_users** (1 registro):
```json
{
  "id": 1,
  "name": "Administrator",
  "email": "admin@admin.com",
  "password": "123"
}
```

**categories** (6 registros):
```json
[
  { "id": 1, "name": "Eletronicos" },
  { "id": 2, "name": "Roupas" },
  { "id": 3, "name": "Alimentos" },
  { "id": 4, "name": "Livros" },
  { "id": 5, "name": "Esportes" },
  { "id": 6, "name": "Casa" }
]
```

**products** (8 registros):
```json
[
  { "id": 1, "title": "Smartphone XYZ", "price": 1999.90, "category_id": 1 },
  { "id": 2, "title": "Notebook ABC", "price": 3499.00, "category_id": 1 },
  { "id": 3, "title": "Camiseta Basica", "price": 49.90, "category_id": 2 },
  { "id": 4, "title": "Jaqueta de Couro", "price": 299.00, "category_id": 2 },
  { "id": 5, "title": "Cafe Premium 500g", "price": 32.90, "category_id": 3 },
  { "id": 6, "title": "O Programador Limpo", "price": 89.00, "category_id": 4 },
  { "id": 7, "title": "Bola de Futebol", "price": 79.90, "category_id": 5 },
  { "id": 8, "title": "Jogo de Panelas", "price": 349.00, "category_id": 6 }
]
```

### 7.2 Start Server
```
Usuário → executa `json-rest-server run`
  → Le config.yaml
  → Carrega database.json em memoria
  → Registra rotas CRUD automaticas
  → Inicia servidor HTTP na porta configurada
  → (Opcional) Inicia WebSocket + Socket TCP
  → Exibe URLs de acesso
```

### 7.3 CRUD Request
```
Client → GET/POST/PUT/DELETE /collection
  → Middleware: CORS
  → Middleware: Auth (se habilitado)
  → Middleware: Mock delay (se header presente)
  → Handler: processa operacao no database.json
  → Broadcast: notifica subscribers (se habilitado)
  → Resposta JSON ao client
```

### 7.4 Auth Flow
```
Client → POST /auth {email, password}
  → Busca na collection users (ou adm_users se admin:true)
  → Valida credenciais (ou authFields customizados)
  → Gera access_token (expira em jwtExpire segundos)
  → Gera refresh_token (expira em 7 dias)
  → Resposta: {access_token, refresh_token, type: "Bearer"}

Client → PUT /auth/refresh {refresh_token}
  → Valida refresh_token
  → Gera novos tokens
  → Resposta: {access_token, refresh_token, type: "Bearer"}
```

---

## 8. Regras de Negocio Criticas

1. **Cada chave do database.json = uma collection com rotas CRUD completas**
2. **IDs sao unicos por collection** — conflito retorna 409
3. **Auth opcional** — so habilitada se `auth` estiver no config.yaml
4. **Refresh token validado pelo issuer** (access_token que o gerou)
5. **#userAuthRef so funciona com auth habilitado** — sem auth, retorna 0
6. **Mock delay funciona por request** — header `mock-delay` em segundos
7. **Storage e acessivel sem auth** — arquivos estaticos nao exigem autenticacao
8. **Broadcast so dispara em POST, PUT, DELETE, PATCH** — GET nao dispara
9. **WebSocket filter** — se `?tables=` informado, so recebe dessas tabelas

---

## 9. Escopo MVP

### Incluido no MVP
- CLI: `create` e `run`
- CRUD REST completo (GET, POST, PUT, PATCH, DELETE)
- Filtros por query params
- Paginacao com metadata
- JWT Auth com access/refresh tokens
- Auth fields customizados
- Admin users
- URL skip + wildcard `{*}`
- `#userAuthRef` em body e query
- ID types (int/uuid)
- Mock delay
- Static files (storage/)
- Upload (POST /uploads)
- WebSocket + Socket TCP broadcast
- Filtro por tabela no WebSocket
- Config YAML
- Env vars como override
- Log interno controlavel (`--verbose` ou config)
- Database.json com dados padrao no `create`
- Executavel standalone (Windows, macOS, Linux)
- Tests unitarios e integracao

### Excluido do MVP (Pos-v1.0)
- Slack integration
- CLI upgrade/version
- Rate limiting
- HTTPS/TLS
- CORS configuravel
- Docker image
- Hot reload (--watch)
- Busca avancada (eq, ne, gt, lt)
- Ordenacao (_sort, _order)
- Healthcheck endpoint

---

## 10. Questoes em Aberto

1. **并发 (Concorrencia):** O original nao trata concorrencia no arquivo JSON. Com Node.js,Writes concorrentes podem corromper o arquivo. Solucoes: file locks (medio), operacoes em memoria com debounce (facil), ou SQLite embutido (ideal mas muda o conceito).
   - **Recomendacao:** Operacoes em memoria com debounce de 500ms para persistir. Mais rapido e seguro que I/O direto.

2. **Tamanho maximo do database.json:** O original nao impoe limite. JSONs gigantes podem consumir muita RAM.
   - **Recomendacao:** Documentar que e para uso em desenvolvimento/prototipos, nao para producao com GBs de dados.

3. **Ordem dos registros:** Original mantem ordem de insercao. Ordenacao por campo e Naturalmente necessaria?
   - **Recomendacao:** Manter ordem de insercao como padrao, adicionar `?_sort` como feature futura.

4. **Upload path:** O original salva em `./storage/` relativo ao working directory.
   - **Recomendacao:** Configurar path no config.yaml, padrao `./storage/`.

5. **Backward compatibility com Dart:** O Node.js deve ser 100% compativel com o formato config.yaml e database.json do Dart?
   - **Recomendacao:** Sim, 100% compativel. Mesmo schema de config, mesmo formato de banco.

---

## 11. Metricas de Sucesso

- **Tempo de setup:** < 30 segundos de `create` a `run`
- **Tempo de startup:** < 500ms para iniciar o servidor
- **Binario:** < 50MB por plataforma
- **Testes:** Cobertura >= 80%
- **Compatibilidade:** 100% compativel com config.yaml do Dart original
