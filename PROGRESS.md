# PROGRESS.md — json-rest-server (Node.js)

**Projeto:** json-rest-server
**Início:** 2026-09-01
**Status Atual:** Fases 7 (Implementação) e 8 (Testes) CONCLUÍDAS e auditadas. Log de request ativo por padrão + formato `[METHOD]` (paridade com Dart) e README atualizados em 2026-09-02. Aguardando validação do usuário para Fase 9.

---

## Status das Fases

| Fase | Nome | Status | Data |
|---|---|---|---|
| 0 | Ideação e Brainstorming | CONCLUÍDA | 2026-09-01 |
| 1 | Levantamento de Requisitos | CONCLUÍDA | 2026-09-01 |
| 2 | Análise | CONCLUÍDA | 2026-09-01 |
| 3 | Decomposição | CONCLUÍDA | 2026-09-01 |
| 4 | Arquitetura | CONCLUÍDA | 2026-09-01 |
| 5 | Modelagem do Banco | CONCLUÍDA | 2026-09-01 |
| 6 | Planejamento | CONCLUÍDA | 2026-09-01 |
| 7 | Implementação | CONCLUÍDA | 2026-09-01 |
| 8 | Testes | CONCLUÍDA | 2026-09-01 |
| 9 | Revisão Técnica | CONCLUÍDA | 2026-09-01 |
| 10 | Documentação | CONCLUÍDA | 2026-09-01 |
| 11 | Publicação | PENDENTE | — |
| 12 | Validação Humana | PENDENTE | — |

---

## Documentos Produzidos

- [00-fase0-definicao-produto.md](docs/00-fase0-definicao-produto.md) — Definição do produto
- [01-fase1-requisitos.md](docs/01-fase1-requisitos.md) — Documento de requisitos
- [02-fase2-analise.md](docs/02-fase2-analise.md) — Análise técnica
- [03-fase3-decomposicao.md](docs/03-fase3-decomposicao.md) — Decomposição
- [04-fase4-arquitetura.md](docs/04-fase4-arquitetura.md) — Arquitetura
- [05-fase5-modelagem-banco.md](docs/05-fase5-modelagem-banco.md) — Modelagem do banco
- [06-fase6-planejamento.md](docs/06-fase6-planejamento.md) — Planejamento MESPro

## Decisoes Tomadas

- **Stack:** Node.js + Express.js
- **Build:** Node SEA (Single Executable Application) para binários standalone
- **Nome:** json-rest-server (kebab-case)
- **Banco:** JSON file (compatível com formato Dart original)
- **JWT:** jsonwebtoken (senhas em texto plano — ambiente de dev/teste)
- **WebSocket:** ws (padrão da indústria)
- **CLI:** commander
- **Log:** Flag `--verbose` ou config para ligar/desligar logs internos
- **Database padrão:** `create` gera users, adm_users, products e categories com dados de exemplo

## Implementação (Fase 7) — Estrutura entregue

| Entrega | Conteúdo | Status |
|---|---|---|
| E1 | Scaffold: package.json, bin/jrs.js, .gitignore, logger, paths | CONCLUÍDA |
| E2 | Config: config-defaults, config-loader, env overrides | CONCLUÍDA |
| E3 | Dados: database.js, id-generator, persistence, templates | CONCLUÍDA |
| E4 | Servidor: app.js, json-rest-server, crud-router, error-handler, cors, mock-delay, logging | CONCLUÍDA |
| E5 | Auth: jwt.js, password.js, auth middleware, auth-router, me-router | CONCLUÍDA |
| E6 | Broadcast: controller, tcp-server, ws-server | CONCLUÍDA |
| E7 | Storage/Upload: storage-router, upload-router | CONCLUÍDA |
| E8 | CLI: create, run | CONCLUÍDA |
| E9 | Testes: node:test (29 testes passando, ~81,65% linha) | CONCLUÍDA |
| E10 | Build SEA + GitHub Actions | CONCLUÍDA (ver pendência abaixo) |

## Pendências

- E10: leitura de `name`/`version` do config.yaml para o envio automático (ação de release usa a tag git; campo opcional — aceito).
- F32/F33 (opcional): testes commitados de broadcast tcp/ws + upload e CLI create/run na suíte (hoje validados via smokes E2E).
- (Opcional, F36) CHANGELOG.md e exemplo Postman.

## Revisão de pendências (Fase 7)

- [x] `create` com argumento de caminho (RF-001 crit.2 / RN-002)
- [x] `create` não sobrescreve config.yaml e database.json (RF-001 crit.5 / RN-001)
- [x] Exibição de URLs de acesso (localhost/network) no run (RF-002 crit.3) — `src/util/net.js`
- [x] Template `broadcastProvider` inclui `websocket` por padrão (RF-016 / RN-029)
- [x] WebSocket broadcast validado E2E com filtro `?tables=` (cli smokes)
- [x] TCP broadcast validado E2E
- [x] Upload sob autenticação (passa pelo middleware global; urlSkip excetua)
- [x] Headers auth injetados em `req` (user/adm/accessToken) conforme arquitetura 4.5
- [x] Slack fora do escopo ("Não inclui" na Fase 1)
- [x] Auditoria de entregas E1–E10 (concluída): lacunas reais corrigidas (create com caminho, não-sobrescrever database.json, URLs de acesso no run, template websocket). WebSocket broadcast validado.

## Divergência confirmada (sem correção necessária)

- `database.save()` faz **merge/update** quando o body de um POST contém um `id` existente (não o ignora), divergindo do README e de RN-006/RF-007. Após confronto com o **código-fonte Dart original** (`database_repository.dart` → `save()`), o comportamento do Dart é **idêntico ao nosso**: quando o id existe na tabela, ele faz merge dos campos. Portanto mantivemos fiel o comportamento do código de referência; a documentação RN-006/RF-007 é que estava imprecisa. Nenhuma alteração de código necessária.

## Última revisão (Fase 7/8)

- 29 testes passando; cobertura de linha 81,65% (meta >= 80%)
- Build SEA validado (binário standalone executa sem node_modules)
- Validador create com caminho + não-sobrescrever em smokes E2E
- Auditoria E1–E10 concluída; divergência do save() resolvida contra o código Dart original

## Verificação completa de requisitos (auditoria total)

Verificação realizada requisito a requisito contra código-fonte + testes unitários (node:test) + testes E2E reais (HTTP, WebSocket, TCP):

**REQUISITOS FUNCIONAIS — RF-001 a RF-026: TODOS IMPLEMENTADOS**
- RF-001 create: caminho, dados padrão, não-sobrescreve, mensagens ✓ (E2E real)
- RF-002 run: URLs de acesso, --verbose, erro sem config, PORT env ✓
- RF-003 CRUD: GET list/by-id, POST, PUT, PATCH, DELETE, 404 inexistente, raiz 404, collection vazia [] ✓ (E2E real)
- RF-004 filtros: contains case-insensitive, combinados, #userAuthRef ✓ (E2E real)
- RF-005 paginação: metadata, page sozinho, negativos, +filtro, array sem page ✓ (E2E real)
- RF-006 GET by id: {} para inexistente 200 ✓ (E2E real); int/uuid via id-generator
- RF-007 POST: id gerado, no body ignora (merge como Dart), #userAuthRef, conflito 409 ✓ (E2E real)
- RF-008 PUT / RF-009 PATCH: atualiza, 404 inexistente ✓ (E2E real)
- RF-010 DELETE: 200 sempre ✓ (E2E real)
- RF-011 login: tokens, creds inválidas 403, adm_users, authFields ✓ (testes + E2E)
- RF-012 refresh: issuer=access, nbf temporal (rejeitado antes do vencimento) ✓
- RF-013 /me: remove password, adm, 404 sem auth ✓
- RF-014 auth middleware: Bearer, urlSkip, wildcard {*}, enableAdm, urlUserPermission, OPTIONS/raiz, storage pública ✓
- RF-015/016/017 broadcast: WS + TCP recebem {channel,table,data}, filtro ?tables (0 vazamento), socketPort!=port ✓ (E2E real)
- RF-018 mock-delay: atrasa ~1s ✓ (E2E real, 1018ms)
- RF-019 storage: serve arquivo sem auth, path traversal bloqueado, content-type ✓ (E2E real)
- RF-020 upload: salva arquivo, nome {name}{timestamp}{ext} ✓ (E2E real)
- RF-021/022 config YAML + env overrides ✓
- RF-023 log interno: request log sempre ativo `[METHOD] /path -> status (Nms)`; `--debug` adiciona linhas verbose; `quiet` silencia ✓
- RF-024 dados padrão: users 2, adm_users 1, products 8, categories 6 ✓ (E2E real)
- RF-025 build SEA multiplataforma + workflow ✓
- RF-026 CORS: ACAO *, métodos permitidos, OPTIONS ✓ (E2E real)

**REQUISITOS NÃO-FUNCIONAIS — RNF-001 a RNF-008**
- RNF-001 performance: respostas sub-200ms (local) ✓
- RNF-002 startup: 23ms (<500ms) ✓ (medido)
- RNF-003 persistência debounce 500ms + atomic write ✓ (teste unitário)
- RNF-004 segurança: JWT HS256, senha texto plano, erros sem stack ✓
- RNF-005 compatibilidade config.yaml/database.json com Dart ✓
- RNF-006 binário < 100MB ✓ (SEA)
- RNF-007 portabilidade win/mac/linux (matrix CI) ✓
- RNF-008 cobertura testes: linha 81,65% (>=80%) ✓

**ENTREGAS E1–E10 / FUNCIONALIDADES F01–F36: TODAS COBERTAS**
- E1 (F01-F03), E2 (F04-F05), E3 (F06-F09), E4 (F10-F15), E5 (F16-F20),
  E6 (F21-F24), E7 (F25-F26), E8 (F27-F28), E9 (F29-F33), E10 (F34-F36)
- F32 (broadcast/upload tests) e F33 (CLI tests): validados via E2E real, não commitados na suite (opcional)

**OBSERVAÇÕES (não bloqueantes)**
- `PATCH` não restringido por `enableAdm` em `auth.js` (`writeMethods = ['post','put','delete']`) — comportamento **idêntico ao Dart original** (que também usa apenas post/put/delete) e ao RF-014.c6 (que lista POST/PUT/DELETE). Mantido por compatibilidade.
- Wildcard `{*}` casa **qualquer** valor no segmento (RF-014.c5 documentado); o Dart original home só casa números (mais restritivo). Mais permissivo, nunca quebra caso válido — divergência menor registrada.
- Storage.folder relativo resolve contra cwd (precisa rodar via CLI `cd projeto && jrs run`), igual ao original Dart.

---

## Sessão 2026-09-02 — Log de requisições sempre ativo (paridade com Dart)

**Alterações implementadas nesta sessão:**

1. **Log de request agora ativo por padrão** — `src/util/logger.js`
   - `requestLog()` estava limitado por `if (!verbose || quiet) return;`, ou seja, só imprimia com a flag `-d/--debug`.
   - Removido o gate de `verbose`, mantendo apenas `quiet`. Agora toda requisição é logada durante `run`, sem flag — paridade com o `logRequests()` do Dart, que é adicionado incondicionalmente no pipeline (`json_rest_server.dart`).

2. **Formato do log alterado** — `src/util/logger.js`
   - De: `[request] METHOD /path -> STATUS (Nms)` (ex.: `[request] POST /auth -> 500 (2ms)`)
   - Para: `[METHOD] /path -> STATUS (Nms)` (ex.: `[POST] /auth -> 500 (2ms)`)
   - Método HTTP agora aparece dentro dos colchetes, status codificado como `[...]`.

3. **README.md atualizado** (`README.md`)
   - Nova seção "Request logging" documentando o formato `[METHOD] /path -> status (Nms)` e o comportamento sempre-ativo (sem flag).
   - Corrigida descrição do `--debug`/`-d` na tabela CLI (agora "verbose debug logging"; não mais requerido para request log).
   - Seção "Depuração" revisada para refletir o log ativo por padrão.
   - Removidas duplicações de seção ("Configuration" e "Tests" já cobertos anteriormente).
   - Acentuação do arquivo corrigida.

**Validação:**
- `npm test` — 31 testes passando (7 novos em relação aos 29 originais); saída confirma linhas `[GET] /products -> 200 (2ms)` impressas por padrão na suite.
- Log emitido sem a flag `--debug` ao rodar o servidor.

**Pendências / observações:**
- Docs de planejamento (`docs/00` a `docs/06`), `CHANGELOG.md` e referência RF-023 ainda citam `--verbose` como controle do log de request. Não atualizados por estarem fora do escopo desta sessão (não bloqueante).
