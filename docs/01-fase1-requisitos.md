# Documento de Requisitos — json-rest-server

**Versão:** 1.0
**Data:** 01/09/2026
**Autor:** Petrux-Analyst
**Status:** Rascunho

---

## 1. Visão Geral

### 1.1 Descrição do Sistema

Servidor RESTful local baseado em JSON, distribuido como executavel standalone multiplataforma (Windows, macOS, Linux). A partir de um `database.json` simples, o sistema gera rotas CRUD completas para cada collection, com autenticacao JWT, paginacao, filtros, upload de arquivos, servico de arquivos estaticos e broadcast em tempo real via Socket TCP e WebSocket.

### 1.2 Objetivos

- Objetivo 1: Prover backend mock funcional em menos de 30 segundos para desenvolvedores mobile/web
- Objetivo 2: Manter compatibilidade total com o config.yaml e database.json do projeto Dart original
- Objetivo 3: Distribuir como binario standalone sem necessidade de Node.js instalado
- Objetivo 4: Incluir autenticacao JWT completa (login, refresh token, admin, me) pronta para uso
- Objetivo 5: Suportar broadcast em tempo real via Socket TCP e WebSocket com filtro por tabela

### 1.3 Escopo

**Inclui:**
- ✅ CLI `create` e `run`
- ✅ CRUD REST automatico por collection
- ✅ Filtros por query params + paginacao com metadata
- ✅ JWT Auth (access_token, refresh_token, admin, /me)
- ✅ Auth fields customizados e URL skip com wildcard
- ✅ ID types (int auto-incremento / uuid)
- ✅ Mock delay via header
- ✅ Static files (storage/) e upload via multipart
- ✅ WebSocket + Socket TCP broadcast com filtro por tabela
- ✅ Config YAML + override via env vars
- ✅ Log interno controlavel (--verbose / config)
- ✅ Database.json com dados padrao no `create`
- ✅ Build multiplataforma (Node SEA)
- ✅ Testes unitarios e integracao

**Não Inclui:**
- ❌ Slack integration
- ❌ CLI upgrade/version
- ❌ Rate limiting
- ❌ HTTPS/TLS
- ❌ CORS configuravel
- ❌ Docker image
- ❌ Hot reload (--watch)
- ❌ Busca avancada (eq, ne, gt, lt — operadores)
- ❌ Ordenacao (_sort, _order)
- ❌ Healthcheck endpoint (/health)

---

## 2. Requisitos Funcionais

### RF-001: Comando `create`

**Descrição:** O CLI deve criar a estrutura inicial do projeto: config.yaml, database.json com dados padrao e pasta storage/.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: Executar `json-rest-server create` em pasta vazia cria config.yaml, database.json e storage/
- [ ] Criterio 2: Executar `json-rest-server create ./nome_pasta` cria a pasta e os arquivos dentro dela
- [ ] Criterio 3: database.json criado com collections padrao: users (2), adm_users (1), products (8), categories (6)
- [ ] Criterio 4: config.yaml criado com valores padrao (port: 8080, host: 0.0.0.0, database: database.json, idType: int)
- [ ] Criterio 5: Se o diretorio ja contem os arquivos, nao sobrescreve (exibe aviso)
- [ ] Criterio 6: Exibe mensagens de sucesso e instrucoes de uso ao final

**Regras de Negocio:**
- RN-001: O comando nao deve sobrescrever arquivos existentes
- RN-002: A pasta destino deve ser criada se nao existir

### RF-002: Comando `run`

**Descrição:** O CLI deve iniciar o servidor HTTP com base no config.yaml local (ou no diretorio informado).

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: Executar `json-rest-server run` carrega config.yaml e inicia o servidor na porta configurada
- [ ] Criterio 2: Startup completo em menos de 500ms
- [ ] Criterio 3: Exibe URLs de acesso (localhost, ethernet e wi-fi quando host for 0.0.0.0)
- [ ] Criterio 4: Aceita flag `--verbose` para logs detalhados
- [ ] Criterio 5: Se config.yaml nao existir, exibe erro orientativo
- [ ] Criterio 6: Respeita PORT env var como override

**Regras de Negocio:**
- RN-003: Porta e/ou host podem ser sobrescritos por env vars
- RN-004: Nao substituir (nao sobrescrever) o arquivo database.json ao iniciar

### RF-003: CRUD REST automatico

**Descrição:** Para cada chave (collection) no database.json, gerar rotas RESTful automaticamente.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: GET /:collection retorna todos os registros
- [ ] Criterio 2: GET /:collection/:id retorna um registro especifico
- [ ] Criterio 3: POST /:collection cria um novo registro
- [ ] Criterio 4: PUT /:collection/:id substitui campos do registro
- [ ] Criterio 5: PATCH /:collection/:id atualiza parcialmente o registro
- [ ] Criterio 6: DELETE /:collection/:id remove o registro
- [ ] Criterio 7: GET em collection inexistente retorna 404 com mensagem de erro
- [ ] Criterio 8: POST em collection inexistente retorna 404
- [ ] Criterio 9: Rota raiz (/) retorna 404
- [ ] Criterio 10: Collection vazia ([]) responde GET com array vazio

**Regras de Negocio:**
- RN-005: Cada chave do database.json = uma collection
- RN-006: Metodo POST/PUT/PATCH nao suportado retorna 405

### RF-004: Filtros por query params

**Descrição:** GET /:collection deve permitir filtro por qualquer campo via query params.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: `GET /products?title=jornada` filtra por contains (case-insensitive)
- [ ] Criterio 2: Multiplos filtros podem ser combinados (`?title=x&price=10`)
- [ ] Criterio 3: Filtro por `#userAuthRef` substitui pelo id do usuario autenticado
- [ ] Criterio 4: Filtro em campo inexistente retorna lista vazia
- [ ] Criterio 5: Sem query params retorna todos os registros

**Regras de Negocio:**
- RN-007: Filtro e por `contains`, case-insensitive (compativel com original)
- RN-008: `#userAuthRef` sem auth substitui por '0'

### RF-005: Paginacao com metadata

**Descrição:** GET /:collection?page=1&limit=10 deve paginar com metadata de paginacao.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: `?page=1&limit=10` retorna 10 registros (ou menos se fim)
- [ ] Criterio 2: Resposta paginada inclui metadata: { data, total, page, limit, totalPages }
- [ ] Criterio 3: `page` variaivel sozinho usa limit padrao 10
- [ ] Criterio 4: `page` negativa ou nao numerica usa 1
- [ ] Criterio 5: `limit` negativa ou nao numerica usa 10
- [ ] Criterio 6: Paginacao combinada com filtros funciona
- [ ] Criterio 7: Messim sem `page`, a resposta mantem formato array (backwards-compat)

**Regras de Negocio:**
- RN-009: Se `page` presente na query, resposta inclui metadata; senao, resposta e array puro
- RN-010: Total de paginas = ceil(total / limit), minimo 1

### RF-006: GET by ID

**Descrição:** GET /:collection/:id retorna registro especifico.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: Retorna o registro com id informado (int ou uuid conforme idType)
- [ ] Criterio 2: ID inexistente retorna objeto vazio `{}` (compativel com original)
- [ ] Criterio 3: Para idType int, `?id=abc` retorna vazio
- [ ] Criterio 4: Para idType uuid, busca por string

**Regras de Negocio:**
- RN-011: Comportamento de id inexistente mantem compatibilidade: `{}` e status 200

### RF-007: POST /:collection

**Descrição:** Cria registro, gera id automaticamente.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: POST body adiciona registro com id gerado
- [ ] Criterio 2: idType int: id = ultimo id + 1
- [ ] Criterio 3: idType uuid: id = uuid v1
- [ ] Criterio 4: Resposta contem o registro criado com id, status 200 (compativel)
- [ ] Criterio 5: Body com `id` definido e ignorado (seguir original)
- [ ] Criterio 6: Body com `#userAuthRef` substitui pelo id do usuario logado
- [ ] Criterio 7: Date/objetos aninhados preservados

**Regras de Negocio:**
- RN-012: Cliente nao deve definir o id no POST (servidor controla)
- RN-013: `#userAuthRef` substituido em body
- RN-014: Se idType mudar no meio, retorna erro de conflito (mensagem explicativa)

### RF-008: PUT /:collection/:id

**Descrição:** Substitui/atualiza campos do registro.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: PUT com id existente atualiza campos fornecidos
- [ ] Criterio 2: PUT com id inexistente retorna 404
- [ ] Criterio 3: Campos existentes nao fornecidos sao preservados
- [ ] Criterio 4: Resposta contem o registro atualizado, status 200

**Regras de Negocio:**
- RN-015: PUT requer id valido existente (senao 404)

### RF-009: PATCH /:collection/:id

**Descrição:** Atualiza parcialmente o registro.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: PATCH atualiza apenas campos fornecidos
- [ ] Criterio 2: PATCH com id inexistente retorna 404
- [ ] Criterio 3: Resposta contem o registro atualizado, status 200

**Regras de Negocio:**
- RN-016: PATCH e funcionalmente equivalente ao PUT neste sistema (compativel com original)

### RF-010: DELETE /:collection/:id

**Descrição:** Remove registro.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: DELETE remove o registro e responde status 200
- [ ] Criterio 2: DELETE de id inexistente tambem responde 200 (comportamento original)

**Regras de Negocio:**
- RN-017: DELETE sempre responde sucesso (mesmo se nao encontrou), preservando compatibilidade

### RF-011: Autenticacao JWT — Login

**Descrição:** POST /auth autentica usuario e retorna tokens.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: POST /auth com email/password validos retorna { access_token, refresh_token, type: "Bearer" }
- [ ] Criterio 2: Credenciais invalidas retorna status de acesso negado (config unauthorizedStatusCode, padrao 403)
- [ ] Criterio 3: Se collection users nao existe, retorna erro 500 "user table not exists"
- [ ] Criterio 4: authFields customizados usados em vez de email/password
- [ ] Criterio 5: Login admin com `admin: true` busca na collection adm_users
- [ ] Criterio 6: access_token expira em jwtExpire segundos
- [ ] Criterio 7: refresh_token expira em 7 dias
- [ ] Criterio 8: Filtro authFields: campo ausente no body retorna erro claro
- [ ] Criterio 9: Tipos suportados no authFields: string, int, double

**Regras de Negocio:**
- RN-018: Auth so ativa se config.auth existe
- RN-019: Usuarios padrao: admin@admin.com / 123 (admin e comum)
- RN-020: Senha em texto plano (ambiente dev/teste — decisao do produto)

### RF-012: Refresh token

**Descrição:** PUT /auth/refresh renova o access token.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: PUT /auth/refresh com refresh_token valido retorna novos tokens
- [ ] Criterio 2: Refresh token validado pelo issuer (access_token que o gerou)
- [ ] Criterio 3: Refresh token invalido retorna erro com codigo e descricao
- [ ] Criterio 4: Refresh token ainda nao valido (notBefore) retorna erro temporal
- [ ] Criterio 5: Aceita header Authorization com Bearer e body refresh_token

**Regras de Negocio:**
- RN-021: Novo access_token descarta o anterior
- RN-022: NotBefore do refresh = jwtExpire (so pode renovar apos expirar access)

### RF-013: Rota /me

**Descrição:** GET /me retorna dados do usuario logado sem password.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: GET /me com token valido retorna dados do usuario (sem password)
- [ ] Criterio 2: Para admin, busca na collection adm_users
- [ ] Criterio 3: Sem auth configurado, retorna 404 com mensagem
- [ ] Criterio 4: Sem token valido, retorna unauthorizedStatusCode
- [ ] Criterio 5: idType int converte o sub (string) para int; uuid usa string

**Regras de Negocio:**
- RN-023: Campo password sempre removido da resposta /me

### RF-014: Middleware de Auth em rotas protegidas

**Descrição:** Todas as rotas exigem token valido quando auth esta habilitado.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: Request sem header Authorization retorna unauthorizedStatusCode
- [ ] Criterio 2: Token invalido/expirado retorna unauthorizedStatusCode
- [ ] Criterio 3: Authorization deve ser "Bearer <token>"
- [ ] Criterio 4: Rotas em urlSkip nao exigem auth
- [ ] Criterio 5: Wildcard `{*}` em urlSkip casa qualquer valor no segmento
- [ ] Criterio 6: enableAdm restringe POST/PUT/DELETE a admins
- [ ] Criterio 7: urlUserPermission permite usuario comum em urls especificas
- [ ] Criterio 8: OPTIONS e rota raiz nao exigem auth
- [ ] Criterio 9: Pasta storage e publica (sem auth)

**Regras de Negocio:**
- RN-024: Auth aplicado por mesmo padrao do original (skip por path+method)
- RN-025: Wildcard `{*}` compara por segmentos
- RN-026: quando enableAdm ativo e rotas sem permissao, retorna unauthorized

### RF-015: Envio de broadcast

**Descrição:** Sistema notifica clientes Socket/WebSocket apos POST/PUT/PATCH/DELETE.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: Apos verbo de escrita, evento emitido para subscribers
- [ ] Criterio 2: Canais: nome do verbo (POST, PUT, DELETE, PATCH) ou header socket-channel
- [ ] Criterio 3: Payload contem channel, table e data
- [ ] Criterio 4: GET nao dispara broadcast
- [ ] Criterio 5: Sem clientes conectados, nenhum envio e feito
- [ ] Criterio 6: broadcastProvider configuraveis (socket; suporte slack postemplo)

**Regras de Negocio:**
- RN-027: Broadcast disparado somente em verbos de escrita
- RN-028: Header socket-channel sobrescreve canal padrao

### RF-016: WebSocket

**Descrição:** Servidor WebSocket na mesma porta do HTTP.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: Conexao ws://localhost:PORT recebe broadcasts
- [ ] Criterio 2: Filtro por tabela via query `?tables=users,products`
- [ ] Criterio 3: Com filtro, so recebe eventos das tabelas informadas
- [ ] Criterio 4: Sem filtro, recebe eventos de todas as tabelas
- [ ] Criterio 5: Habilitado por enableSocket: true

**Regras de Negocio:**
- RN-029: WebSocket ativo junto ao HTTP quando enableSocket
- RN-030: Filtro por tabela e exclusivo (so as informadas)

### RF-017: Socket TCP

**Descrição:** Servidor TCP dedicado para broadcast em socketPort.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: socketPort cria servidor TCP que recebe eventos
- [ ] Criterio 2: socketPort diferente do port do HTTP (se igual, erro e saida)
- [ ] Criterio 3: Client conectado recebe mensagens JSON dos canais
- [ ] Criterio 4: Sem clientes conectados, nenhum envio

**Regras de Negocio:**
- RN-031: socketPort == port causa erro/saida (mesma regra do original)

### RF-018: Mock delay

**Descrição:** Header mock-delay simula lentidao do servidor.

**Prioridade:** Media

**Critérios de Aceite:**
- [ ] Criterio 1: Header `mock-delay: 10` atrasa resposta em 10 segundos
- [ ] Criterio 2: Valor nao numerico tratado como 0 (sem delay)
- [ ] Criterio 3: Aplicado a todos os metodos HTTP

**Regras de Negocio:**
- RN-032: Delay em segundos inteiros, padrao 0

### RF-019: Static files

**Descrição:** Pasta storage/ serve arquivos estaticos.

**Prioridade:** Media

**Critérios de Aceite:**
- [ ] Criterio 1: GET /storage/<arquivo> serve arquivos da pasta storage/
- [ ] Criterio 2: Path configurável no config (storage.folder)
- [ ] Criterio 3: Acesso sem autenticacao
- [ ] Criterio 4: Content-type correto para imagens

**Regras de Negocio:**
- RN-033: Storage configurado em config.yaml (padrao ./storage)

### RF-020: Upload

**Descrição:** POST /uploads com multipart/form-data.

**Prioridade:** Media

**Critérios de Aceite:**
- [ ] Criterio 1: POST /uploads com formulario multipart salva o arquivo
- [ ] Criterio 2: Requer nome do arquivo no multipart original (filename) — decisoes
- [ ] Criterio 3: Arquivo salvo na pasta de storage configurada
- [ ] Criterio 4: Resposta contem caminho/metadados do arquivo salvo
- [ ] Criterio 5: Auth aplicado (mesmo middleware), exceto se urlSkip

**Regras de Negocio:**
- RN-034: Upload salva na pasta storage/ configurada
- RN-035: Filename requerido no multipart

### RF-021: Config YAML

**Descrição:** Arquivo config.yaml define todas as configuracoes.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: Carrega name, port, host, database, idType do config.yaml
- [ ] Criterio 2: Carrega auth (jwtSecret, jwtExpire, unauthorizedStatusCode, enableAdm, urlUserPermission, urlSkip, authFields)
- [ ] Criterio 3: Carrega enableSocket, socketPort, broadcastProvider, slack
- [ ] Criterio 4: Config ausente usa valores padrao (port 8080, host '', database database.json)
- [ ] Criterio 5: Comentarios aceitos

**Regras de Negocio:**
- RN-036: Schema compativel 100% com o Dart original

### RF-022: Env vars overrides

**Descrição:** Variaveis de ambiente sobrescrevem config.yaml.

**Prioridade:** Media

**Critérios de Aceite:**
- [ ] Criterio 1: PORT sobrescreve config.port
- [ ] Criterio 2: HOST sobrescreve config.host
- [ ] Criterio 3: DATABASE_PATH sobrescreve config.database
- [ ] Criterio 4: JWT_SECRET sobrescreve config.auth.jwtSecret

**Regras de Negocio:**
- RN-037: Env var tem precedencia sobre config.yaml

### RF-023: Log interno

**Descrição:** Logs de request detalhados, controlaveis.

**Prioridade:** Media

**Critérios de Aceite:**
- [ ] Criterio 1: `--verbose` ou config log nivel habilita logs de request (metodo, path, status, duracao)
- [ ] Criterio 2: Desligado por padrao (ou nivel basico sem detalhes)
- [ ] Criterio 3: Erros internos sempre logados (nao expoem stack ao client)

**Regras de Negocio:**
- RN-038: Erros retornam mensagem generica ao client; detalhes so no log

### RF-024: Dados padrao no create

**Descrição:** create popula database.json com dados de exemplo.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: users: 2 usuarios (admin@admin.com, user@user.com) com senha '123'
- [ ] Criterio 2: adm_users: 1 admin (admin@admin.com)
- [ ] Criterio 3: products: 8 produtos com id, title, price, category_id
- [ ] Criterio 4: categories: 6 categorias com id e name
- [ ] Criterio 5: Estrutura JSON valida e imediatamente usavel pelo servidor

**Regras de Negocio:**
- RN-039: Dados padrao permitem testar login e CRUD de primeira

### RF-025: Executavel multiplataforma

**Descrição:** Build gera binario standalone para Windows, macOS, Linux.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: Script de build gera binario para plataforma alvo (Node SEA)
- [ ] Criterio 2: Binario funciona sem Node.js instalado
- [ ] Criterio 3: Binario < 100MB
- [ ] Criterio 4: Nomes de saída: json-rest-server-<plataforma>-<arch>[.exe]

**Regras de Negocio:**
- RN-040: Build multiplataforma documentado e reproduzivel

### RF-026: OPTIONS / CORS

**Descrição:** CORS habilitado por padrao.

**Prioridade:** Alta

**Critérios de Aceite:**
- [ ] Criterio 1: OPTIONS responde com headers CORS permitidos
- [ ] Criterio 2: Respostas incluem Access-Control-Allow-Origin: *
- [ ] Criterio 3: Metodos permitidos: GET, POST, PUT, PATCH, DELETE, OPTIONS

**Regras de Negocio:**
- RN-041: CORS liberado por padrao (ambiente dev)

---

## 3. Requisitos Não-Funcionais

### RNF-001: Performance

**Descrição:** Servidor deve responder rapidamente.
**Métrica:** Tempo de resposta < 200ms em 95% das requisicoes locais.
**Prioridade:** Alta

### RNF-002: Startup

**Descrição:** Servidor inicia rapidamente.
**Métrica:** Startup completo < 500ms.
**Prioridade:** Alta

### RNF-003: Persistencia com debounce

**Descrição:** Writes em disco nao bloqueiam request.
**Métrica:** Save via debounce (500ms) — 1 write máximo por periodo de 500ms.
**Prioridade:** Alta

### RNF-004: Seguranca

**Descrição:** Senhas em texto plano (decisao de produto — dev/teste). JWT com jsonwebtoken.
**Métrica:** Token JWT assinado HS256 com jwtSecret.
**Prioridade:** Media

### RNF-005: Compatibilidade

**Descrição:** 100% compativel com config.yaml e database.json do Dart original.
**Métrica:** Mesmo schema de config; mesmo formato de banco; mesmas respostas basicas.
**Prioridade:** Alta

### RNF-006: Tamanho do binario

**Descrição:** Binario standalone compacto.
**Métrica:** < 100MB por plataforma (ideal < 50MB).
**Prioridade:** Media

### RNF-007: Portabilidade

**Descrição:** Funciona em Windows, macOS (x64/arm64) e Linux (x64).
**Métrica:** Build reproduzivel nas 4 combinações.
**Prioridade:** Alta

### RNF-008: Testabilidade

**Descrição:** Cobertura de testes adequada.
**Métrica:** Cobertura >= 80%.
**Prioridade:** Alta

---

## 4. Regras de Negocio (Consolidadas)

### RN-001: create nao sobrescreve
**Descrição:** command cria arquivos somente se nao existirem.
**Quando Aplicar:** execucao do comando create.
**Exceções:** flag forcada (futuro) pode sobrescrever.

### RN-002: Pasta destino auto-criada
**Descrição:** create ./x cria a pasta x.
**Quando Aplicar:** create com argumento de caminho.

### RN-003: Env sobrepoe config
**Descrição:** PORT, HOST, DATABASE_PATH, JWT_SECRET sobrescrevem config.yaml.
**Quando Aplicar:** startup do servidor.

### RN-004: Cada chave = collection
**Descrição:** registra rotas para cada chave de database.json.
**Quando Aplicar:** startup + request.

### RN-005: Acesso a colecoes inexistentes -> 404
**Descrição:** GET/POST em table inexistente retorna 404.
**Quando Aplicar:** request para tabela desconhecida.

### RN-006: POST com id controlado pelo servidor
**Descrição:** id gerado automaticamente no POST.
**Quando Aplicar:** POST /:collection.

### RN-007: Conflito de idType -> erro explicativo
**Descrição:** dados com id int mas idType uuid (ou vice-versa) geram erro de conflito.
**Quando Aplicar:** POST quando mixed data existe em table.
**Exceções:** mensagem indica mudanca de idType no meio.

### RN-008: Autenticacao opcional
**Descrição:** auth ativo somente se presente no config.
**Quando Aplicar:** todas as rotas protegidas.

### RN-009: Senha texto plano
**Descrição:** sem hash, ambiente dev/teste.
**Quando Aplicar:** armazenamento de usuarios.

### RN-010: Refresh token 7 dias, iss = access token
**Descrição:** refresh validado pelo access token que o gerou.
**Quando Aplicar:** PUT /auth/refresh.

### RN-011: /me remove password
**Descrição:** response nunca inclui password.
**Quando Aplicar:** GET /me.

### RN-012: Broadcast so em verbos de escrita
**Descrição:** POST, PUT, PATCH, DELETE emitem eventos; GET nao.
**Quando Aplicar:** apos handler de escrita.

### RN-013: Socket/WebSocket sem clientes nao envia
**Descrição:** providers inativos nao disparam eventos.
**Quando Aplicar:** broadcast.

### RN-014: Storage publica
**Descrição:** arquivos estaticos nao exigem autenticacao.
**Quando Aplicar:** GET /storage/*.

### RN-015: socketPort != port HTTP
**Descrição:** socket TCP usa porta dedicada diferente da HTTP.
**Quando Aplicar:** startup com enableSocket.

---

## 5. Ambiguidades Identificadas

### AMB-001: Resposta de POST

**Problema:** Original retorna 200 (nao 201) para POST.
**Interpretação 1:** Manter 200 (compatibilidade total).
**Interpretação 2:** Usar 201 (convencao REST), quebrando compatibilidade.
**Recomendação:** Manter 200 para compatibilidade com clientes do original.

### AMB-002: Paginacao — resposta com metadata

**Problema:** Se incluir metadata, quebra formato de resposta para quem espera array.
**Interpretação 1:** Paginacao retorna { data, total, page, limit, totalPages }.
**Interpretação 2:** Retorna apenas array (como original), sem metadata.
**Recomendação:** Se `page` presente, retorna objeto com metadata. Sem `page`, mantem array puro. Backwards-compatible e adiciona valor.

### AMB-003: DELETE id inexistente

**Problema:** Original nao erro retorna 200 mesmo sem encontrar.
**Interpretação 1:** Retornar 404 para id inexistente (convencao REST).
**Interpretação 2:** Retornar 200 sempre (compatibilidade).
**Recomendação:** Manter 200 (compatibilidade com original).

### AMB-004: id de PUT/PATCH

**Problema:** PUT/PATCH com id inexistente.
**Interpretação 1:** 404 ResourceNotFound.
**Interpretação 2:** criar registro (upsert).
**Recomendação:** 404 (comportamento original).

### AMB-005: Storage path

**Problema:** Original usa './' relativo.
**Interpretação 1:** Configuravel via config.yaml (melhor).
**Interpretação 2:** Fixo em storage/.
**Recomendação:** Configuravel, padrao storage/ — mais flexivel.

---

## 6. Dúvidas Pendentes

### DÚV-001: Upgrade path do storage

**Impacto:** Baixo
**Pergunta:** Quando config.storage.folder mudar, mover arquivos existentes?
**Por que e importante:** Evitar quebra de uploads antigos.

### DÚV-002: Compatibilidade com o jrs original

**Impacto:** Medio
**Pergunta:** Ha usuarios do jrs Dart querendo migracao automatica?
**Por que e importante:** Define se `create` deve oferecer import de config existente.

### DÚV-003: Versionamento da resposta de erro

**Impacto:** Baixo
**Pergunta:** Formato padrao de erro esperado pelos clientes? (campo 'erro' vs 'error')
**Por que e importante:** Original usa ambos dependendo do caso; normalizar mantendo compativel.

---

## 7. Alternativas Avaliadas

### ALT-001: Framework HTTP

**Descrição:** Express.js vs Fastify vs zero-dep core http.
**Prós Express:**
- ✅ Ecossistema maduro, familiar a todos
- ✅ Middleware extenso (multer, morgan, etc.)
- ✅ Documentacao vasta

**Prós Fastify:**
- ✅ Mais rapido (schema serialization)
- ✅ Schema validation nativo

**Contras Express:**
- ❌ Menos performatico que Fastify em benchmarks

**Contras Fastify:**
- ❌ Ecossistema menor, curva maior

**Custo:** Sem custo (open source)
**Prazo:** Sem impacto relevante
**Recomendacao:** Sim (Express)
**Justificativa:** Familiaridade, middleware maduro (multer para upload) e simplicidade para o escopo.

### ALT-002: Build standalone

**Descrição:** Node SEA vs pkg vs nexe vs Bun compile.
**Prós Node SEA:**

- ✅ Nativo desde Node 20, sem dep externa
- ✅ Controle total do Node runtime

**Prós pkg (vercel):**

- ✅ Maduro e popular
- ❌ Manutencao ha descontinuado

**Prós Bun compile:**

- ✅ Binario pequeno/rapido
- ❌ Compatibilidade menor; mudaria runtime

**Contras Node SEA:**
- ❌ Build por plataforma exige build em cada SO (CI)

**Custo:** Gratuito
**Prazo:** Setup CI 1 dia
**Recomendacao:** Sim (Node SEA)
**Justificativa:** Zero dependencia, oficial do projeto Node, sem manter lib de terceiros.

### ALT-003: Broadcast provider

**Descrição:** Implementacao socket proprio vs socket.io
**Prós proprio (ws + net):**
- ✅ Zero deps extras, protocolo simples
- ✅ Compatibilidade com o formato original

**Prós socket.io:**
- ✅ Fallback automatico, easy client
- ❌ Diferente do protocolo do original (incompativel)

**Custo:** Gratuito
**Prazo:** Sem impacto
**Recomendacao:** Sim (ws + net)
**Justificativa:** Compatibilidade com clientes do jrs Dart + leveza.

### ALT-004: Persistencia

**Descrição:** arquivo JSON direto vs lowdb vs SQLite.
**Prós JSON direto:**
- ✅ Zero deps, compat com original
- ❌ Concorrencia manual

**Prós lowdb:**
- ✅ Wraps JSON concorrente
- ❌ Mais uma camada

**Prós SQLite (better-sqlite3):**
- ✅ Escala, transacoes
- ❌ Muda o conceito (agora "banco") e formato do database.json

**Custo:** Gratuito
**Prazo:** Baixo impacto
**Recomendacao:** Sim (JSON direto + debounce em memoria)
**Justificativa:** Preserva compatibilidade e simplicidade; escala suficiente para mock.

---

## 8. Stakeholders

- **Cliente:** Pedro Conrad Junior (idealizador do port)
- **Usuarios Finais:** Desenvolvedores mobile/web (Flutter, React Native, web apps)
- **Equipe Tecnica:** Petrux (Agent team) — Backend (Node.js)
- **Aprovadores:** Pedro Conrad Junior
- **Outros:** Comunidade Dart do json_rest_server original (usuarios potenciais)

---

## 9. Premissas

- Premissa 1: Users nao usarao em producao (somente dev/teste)
- Premissa 2: Volume de dados pequeno (prototipo)
- Premissa 3: Eventual migracao de usuarios do Dart nao exige tooling automatico (apenas config/database compativeis)
- Premissa 4: Node.js >= 20 disponivel no ambiente de build

**Risco:** Se Premissa 3 falhar (migracao automatica necessaria), adicionar command `import` — impacto baixo.

---

## 10. Restricoes

- Tecnologia: Node.js + Express.js, CommonJS ou ESM conforme padrao
- Runtime minimo: Node >= 20 (para Node SEA)
- Build: Node SEA para binarios
- Banco: JSON file, formato compativel com Dart
- Auth: JWT HS256, refresh token 7 dias
- Compatibilidade: schema config.yaml identico ao Dart
- Sem hash de senha (texto plano — decisao de produto)
- Sem dependencias extras para socket (ws + net)

---

## 11. Matriz de Rastreabilidade

| ID | Requisito | Fonte | Prioridade | Complexidade | Status |
|----|-----------|-------|------------|--------------|--------|
| RF-001 | CLI create | Original + ajuste | Alta | Baixa | Aprovado |
| RF-002 | CLI run | Original | Alta | Media | Aprovado |
| RF-003 | CRUD automatico | Original | Alta | Alta | Aprovado |
| RF-004 | Filtros | Original | Alta | Media | Aprovado |
| RF-005 | Paginacao | Original + melhoria | Alta | Media | Aprovado |
| RF-006 | GET by ID | Original | Alta | Baixa | Aprovado |
| RF-007 | POST | Original | Alta | Media | Aprovado |
| RF-008 | PUT | Original | Alta | Media | Aprovado |
| RF-009 | PATCH | Original | Alta | Media | Aprovado |
| RF-010 | DELETE | Original | Alta | Baixa | Aprovado |
| RF-011 | Login | Original | Alta | Alta | Aprovado |
| RF-012 | Refresh token | Original | Alta | Media | Aprovado |
| RF-013 | /me | Original | Alta | Baixa | Aprovado |
| RF-014 | Auth middleware | Original | Alta | Alta | Aprovado |
| RF-015 | Broadcast | Original | Alta | Media | Aprovado |
| RF-016 | WebSocket | Original | Alta | Media | Aprovado |
| RF-017 | Socket TCP | Original | Alta | Media | Aprovado |
| RF-018 | Mock delay | Original | Media | Baixa | Aprovado |
| RF-019 | Static files | Original | Media | Baixa | Aprovado |
| RF-020 | Upload | Original | Media | Media | Aprovado |
| RF-021 | Config YAML | Original | Alta | Media | Aprovado |
| RF-022 | Env vars | Melhoria | Media | Baixa | Aprovado |
| RF-023 | Log interno | Melhoria | Media | Baixa | Aprovado |
| RF-024 | Dados padrao | Ajuste | Alta | Baixa | Aprovado |
| RF-025 | Build multiplataforma | Melhoria | Alta | Media | Aprovado |
| RF-026 | CORS | Original | Alta | Baixa | Aprovado |

---

## 12. Aprovacao

**Aprovado por:** Pedro Conrad Junior
**Data:** ___/___/___
**Status:** Aguardando aprovacao

---

## Historico de Versoes

| Versao | Data | Autor | Alteracoes |
|--------|------|-------|------------|
| 1.0 | 01/09/2026 | Petrux-Analyst | Versao inicial |