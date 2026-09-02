# Changelog

All notable changes to the `json-rest-server` project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/specv2.0.0.html).

## [Unreleased] - 2026-09-02

### Changed
- Log de requisições agora **ativo por padrão** (sem flag), em paridade com o `logRequests()` do servidor Dart original.
- Formato do log de request alterado de `[request] METHOD /path -> STATUS (Nms)` para `[METHOD] /path -> STATUS (Nms)` (ex.: `[POST] /auth -> 500 (2ms)`).

### Added
- Documentação: `README.md` traduzido para português, novo `README.en.md` (inglês), seções de build autocontido, créditos, aviso de BETA e disclaimer.
- Seção de créditos no README (autor Dart + autor do port).

## [1.0.0] - 2026-09-01

### Added
- Initial release of json-rest-server (Node.js port of `json_rest_server`)
- CLI commands: `create` and `run`
- CRUD REST automatico por collection do database.json
- Filtros por query params (contains case-insensitive)
- Paginacao com metadata (?page) e array puro sem page
- Autenticacao JWT (login, refresh token, /me, admin)
- Broadcast em tempo real via Socket TCP e WebSocket com filtro por tabela
- Upload de arquivos multipart para pasta storage/
- Static files serving da pasta storage/
- Config YAML com overrides via env vars (PORT, HOST, DATABASE_PATH, JWT_SECRET)
- Build standalone Node SEA para Windows, macOS, Linux
- Testes unitarios e integracao (30 testes passando, ~81% cobertura)
- Mock delay via header `mock-delay`
- Middleware de log controlavel (`--verbose`)

### Note
- O comportamento de log evoluiu após o 1.0.0: o request log passou a ser sempre ativo por padrão (ver [Unreleased]).

### Changed
- Behavior fiel ao Dart original: POST retorna 200, DELETE retorna 200 mesmo para id inexistente, GET id inexistente retorna {}
- Senhas em texto plano (decissao de produto — ambiente dev/teste)
- Config.yaml template com broadcastProvider incluindo websocket por padrao

### Fixed
- `database.save()` merge behavior when POST body contains existing `id` (compatível com Dart original)
- POST /auth sem auth configurado retorna 403 ao inv de crash 500
- Wildcard `{*}` em urlSkip: comportamento mais permissivo que Dart (casa qualquer valor vs apenas numericos)

### Security
- CORS liberado por padrao (Ambiente dev)
- Headers auth injetados em req (user/adm/accessToken)
- Path traversal bloqueado no storage-router
- Input validation em rotas CRUD

### Known Limitations
- Slack integration nao incluida (fora do escopo da Fase 1)
- Rate limiting nao implementado
- HTTPS/TLS nao configurado
- Changelog a partir daqui seguiran o formato semver