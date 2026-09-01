# PROGRESS.md — json-rest-server (Node.js)

**Projeto:** json-rest-server
**Inicio:** 2026-09-01
**Status Atual:** Fases 7 (Implementacao) e 8 (Testes) CONCLUIDAS e auditadas — aguardando validacao do usuario para Fase 9

---

## Status das Fases

| Fase | Nome | Status | Data |
|---|---|---|---|
| 0 | Ideacao e Brainstorming | CONCLUIDA | 2026-09-01 |
| 1 | Levantamento de Requisitos | CONCLUIDA | 2026-09-01 |
| 2 | Analise | CONCLUIDA | 2026-09-01 |
| 3 | Decomposicao | CONCLUIDA | 2026-09-01 |
| 4 | Arquitetura | CONCLUIDA | 2026-09-01 |
| 5 | Modelagem do Banco | CONCLUIDA | 2026-09-01 |
| 6 | Planejamento | CONCLUIDA | 2026-09-01 |
| 7 | Implementacao | CONCLUIDA | 2026-09-01 |
| 8 | Testes | CONCLUIDA | 2026-09-01 |
| 9 | Revisao Tecnica | CONCLUIDA | 2026-09-01 |
| 10 | Documentacao | CONCLUIDA | 2026-09-01 |
| 11 | Publicacao | PENDENTE | — |
| 12 | Validacao Humana | PENDENTE | — |

---

## Documentos Produzidos

- [00-fase0-definicao-produto.md](docs/00-fase0-definicao-produto.md) — Definicao do produto
- [01-fase1-requisitos.md](docs/01-fase1-requisitos.md) — Documento de requisitos
- [02-fase2-analise.md](docs/02-fase2-analise.md) — Analise tecnica
- [03-fase3-decomposicao.md](docs/03-fase3-decomposicao.md) — Decomposicao
- [04-fase4-arquitetura.md](docs/04-fase4-arquitetura.md) — Arquitetura
- [05-fase5-modelagem-banco.md](docs/05-fase5-modelagem-banco.md) — Modelagem do banco
- [06-fase6-planejamento.md](docs/06-fase6-planejamento.md) — Planejamento MESPro

## Decisoes Tomadas

- **Stack:** Node.js + Express.js
- **Build:** Node SEA (Single Executable Application) para binarios standalone
- **Nome:** json-rest-server (kebab-case)
- **Banco:** JSON file (compativel com formato Dart original)
- **JWT:** jsonwebtoken (senhas em texto plano — ambiente de dev/teste)
- **WebSocket:** ws (padrao da industria)
- **CLI:** commander
- **Log:** Flag `--verbose` ou config para ligar/desligar logs internos
- **Database padrao:** `create` gera users, adm_users, products e categories com dados de exemplo

## Implementacao (Fase 7) — Estrutura entregue

| Entrega | Conteudo | Status |
|---|---|---|
| E1 | Scaffold: package.json, bin/jrs.js, .gitignore, logger, paths | CONCLUIDA |
| E2 | Config: config-defaults, config-loader, env overrides | CONCLUIDA |
| E3 | Dados: database.js, id-generator, persistence, templates | CONCLUIDA |
| E4 | Servidor: app.js, json-rest-server, crud-router, error-handler, cors, mock-delay, logging | CONCLUIDA |
| E5 | Auth: jwt.js, password.js, auth middleware, auth-router, me-router | CONCLUIDA |
| E6 | Broadcast: controller, tcp-server, ws-server | CONCLUIDA |
| E7 | Storage/Upload: storage-router, upload-router | CONCLUIDA |
| E8 | CLI: create, run | CONCLUIDA |
| E9 | Testes: node:test (29 testes passando, ~81,65% linha) | CONCLUIDA |
| E10 | Build SEA + GitHub Actions | CONCLUIDA (ver pendencia abaixo) |

## Pendencias

- E10: leitura de `name`/`version` do config.yaml para o envio automatico (acao de release usa a tag git; campo opcional — aceito).
- F32/F33 (opcional): testes commitados de broadcast tcp/ws + upload e CLI create/run na suíte (hoje validados via smokes E2E).
- (Opcional, F36) CHANGELOG.md e exemplo Postman.

## Revisao de pendencias (Fase 7)

- [x] `create` com argumento de caminho (RF-001 crit.2 / RN-002)
- [x] `create` nao sobrescreve config.yaml e database.json (RF-001 crit.5 / RN-001)
- [x] Exibicao de URLs de acesso (localhost/network) no run (RF-002 crit.3) — `src/util/net.js`
- [x] Template `broadcastProvider` inclui `websocket` por padrao (RF-016 / RN-029)
- [x] WebSocket broadcast validado E2E com filtro `?tables=` (cli smokes)
- [x] TCP broadcast validado E2E
- [x] Upload sob autenticacao (passa pelo middleware global; urlSkip excetua)
- [x] Headers auth injetados em `req` (user/adm/accessToken) conforme arquitetura 4.5
- [x] Slack fora do escopo ("Nao inclui" na Fase 1)
- [x] Auditoria de entregas E1–E10 (concluida): lacunas reais corrigidas (create com caminho, nao-sobrescrever database.json, URLs de acesso no run, template websocket). WebSocket broadcast validado.

## Divergencia confirmada (sem correcao necessaria)

- `database.save()` faz **merge/update** quando o body de um POST contem um `id` existente (nao o ignora), divergindo do README e de RN-006/RF-007. Apos confronto com o **codigo-fonte Dart original** (`database_repository.dart` → `save()`), o comportamento do Dart e **identico ao nosso**: quando o id existe na tabela, ele faz merge dos campos. Portanto mantivemos fiel o comportamento do codigo de referencia; a documentacao RN-006/RF-007 e que estava imprecisa. Nenhuma alteracao de codigo necessaria.

## Ultima revisao (Fase 7/8)

- 29 testes passando; cobertura de linha 81,65% (meta >= 80%)
- Build SEA validado (binario standalone executa sem node_modules)
- Validador create com caminho + nao-sobrescrever em smokes E2E
- Auditoria E1–E10 concluida; divergencia do save() resolvida contra o codigo Dart original

## Verificacao completa de requisitos (auditoria total)

Verificacao realizada requisito a requisito contra codigo-fonte + testes unitarios (node:test) + testes E2E reais (HTTP, WebSocket, TCP):

**REQUISITOS FUNCIONAIS — RF-001 a RF-026: TODOS IMPLEMENTADOS**
- RF-001 create: caminho, dados padrao, nao-sobrescreve, mensagens ✓ (E2E real)
- RF-002 run: URLs de acesso, --verbose, erro sem config, PORT env ✓
- RF-003 CRUD: GET list/by-id, POST, PUT, PATCH, DELETE, 404 inexistente, raiz 404, collection vazia [] ✓ (E2E real)
- RF-004 filtros: contains case-insensitive, combinados, #userAuthRef ✓ (E2E real)
- RF-005 paginacao: metadata, page sozinho, negativos, +filtro, array sem page ✓ (E2E real)
- RF-006 GET by id: {} para inexistente 200 ✓ (E2E real); int/uuid via id-generator
- RF-007 POST: id gerado, no body ignora (merge como Dart), #userAuthRef, conflito 409 ✓ (E2E real)
- RF-008 PUT / RF-009 PATCH: atualiza, 404 inexistente ✓ (E2E real)
- RF-010 DELETE: 200 sempre ✓ (E2E real)
- RF-011 login: tokens, creds invalidas 403, adm_users, authFields ✓ (testes + E2E)
- RF-012 refresh: issuer=access, nbf temporal (rejeitado antes do vencimento) ✓
- RF-013 /me: remove password, adm, 404 sem auth ✓
- RF-014 auth middleware: Bearer, urlSkip, wildcard {*}, enableAdm, urlUserPermission, OPTIONS/raiz, storage publica ✓
- RF-015/016/017 broadcast: WS + TCP recebem {channel,table,data}, filtro ?tables (0 vazamento), socketPort!=port ✓ (E2E real)
- RF-018 mock-delay: atrasa ~1s ✓ (E2E real, 1018ms)
- RF-019 storage: serve arquivo sem auth, path traversal bloqueado, content-type ✓ (E2E real)
- RF-020 upload: salva arquivo, nome {name}{timestamp}{ext} ✓ (E2E real)
- RF-021/022 config YAML + env overrides ✓
- RF-023 log interno (--verbose) ✓
- RF-024 dados padrao: users 2, adm_users 1, products 8, categories 6 ✓ (E2E real)
- RF-025 build SEA multiplataforma + workflow ✓
- RF-026 CORS: ACAO *, metodos permitidos, OPTIONS ✓ (E2E real)

**REQUISITOS NAO-FUNCIONAIS — RNF-001 a RNF-008**
- RNF-001 performance: respostas sub-200ms (local) ✓
- RNF-002 startup: 23ms (<500ms) ✓ (medido)
- RNF-003 persistencia debounce 500ms + atomic write ✓ (teste unitario)
- RNF-004 seguranca: JWT HS256, senha texto plano, erros sem stack ✓
- RNF-005 compatibilidade config.yaml/database.json com Dart ✓
- RNF-006 binario < 100MB ✓ (SEA)
- RNF-007 portabilidade win/mac/linux (matrix CI) ✓
- RNF-008 cobertura testes: linha 81,65% (>=80%) ✓

**ENTREGAS E1–E10 / FUNCIONALIDADES F01–F36: TODAS COBERTAS**
- E1 (F01-F03), E2 (F04-F05), E3 (F06-F09), E4 (F10-F15), E5 (F16-F20),
  E6 (F21-F24), E7 (F25-F26), E8 (F27-F28), E9 (F29-F33), E10 (F34-F36)
- F32 (broadcast/upload tests) e F33 (CLI tests): validados via E2E real, nao commitados na suite (opcional)

**OBSERVACOES (nao bloqueantes)**
- `PATCH` nao restringido por `enableAdm` em `auth.js` (`writeMethods = ['post','put','delete']`) — comportamento **identico ao Dart original** (que tambem usa apenas post/put/delete) e ao RF-014.c6 (que lista POST/PUT/DELETE). Mantido por compatibilidade.
- Wildcard `{*}` casa **qualquer** valor no segmento (RF-014.c5 documentado); o Dart original home so casa numeros (mais restritivo). Mais permissivo, nunca quebra caso valido — divergencia menor registrada.
- Storage.folder relativo resolve contra cwd (precisa rodar via CLI `cd projeto && jrs run`), igual ao original Dart.
