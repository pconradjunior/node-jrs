# json-rest-server

Um servidor RESTful totalmente funcional baseado em JSON, para desenvolvimento e
prototipagem. **Port para Node.js do
[`json_rest_server`](https://github.com/rodrigorahman/json_rest_server) (Dart)**,
mantendo compatibilidade total com o formato de `config.yaml` / `database.json`
do original.

Funciona como pacote npm **e** como executável standalone multiplataforma
(construído com Node SEA).

## Requisitos
- Node.js >= 20

## Instalação
```bash
npm install -g json-rest-server
```

## Início rápido
```bash
# 1. Gera config.yaml, database.json e a pasta storage/
json-rest-server create

# 2. Inicia o servidor (padrão http://0.0.0.0:8080)
json-rest-server run
# ou simplesmente: json-rest-server
```

- `create` gera um `database.json` com coleções de exemplo: `users`,
  `adm_users`, `categories` e `products`.
- **Rota de storage:** os arquivos enviados via `POST /uploads` são armazenados
  e servidos em `GET /storage/<filename>`.
- **Broadcast:** com `enableSocket: true`, as operações de escrita
  (POST/PUT/PATCH/DELETE) são enviadas como `{channel, table, data}` via TCP
  (padrão `:8081`) e/ou WebSocket.

## CLI
| Comando | Descrição |
|---|---|
| `create` | Gera `config.yaml`, `database.json` e `storage/` iniciais |
| `run` | Inicia o servidor |
| `--debug` / `-d` | Ativa logs de debug detalhados (ex.: auth, persistência, eventos de socket) |

## Log de requisições

Enquanto o servidor está em execução, cada chamada a um endpoint é registrada
com o método HTTP, o caminho, o código de status e a duração — acompanhando o
comportamento sempre ativo do `logRequests()` do servidor Dart original:

```
[JSON Go Server] Server started on http://127.0.0.1:8080
[POST] /auth -> 200 (3ms)
[GET] /products -> 200 (1ms)
[GET] /products/999 -> 404 (0ms)
```

O log de requisições está **ativo por padrão** (não precisa de flag). A flag
`--debug`/`-d` apenas adiciona linhas mais detalhadas (auth, persistência,
eventos de socket); ela não controla o log de requisições. Se precisar silenciá-lo,
o logger oferece um modo `quiet` — veja `src/util/logger.js`.

## Configuração
Todo o comportamento é controlado pelo `config.yaml` (veja o template gerado).
Variáveis de ambiente o sobrescrevem:

| Env | Efeito |
|---|---|
| `PORT` | Porta HTTP |
| `HOST` | Host de escuta |
| `DATABASE_PATH` | Caminho para o arquivo JSON do banco |
| `JWT_SECRET` | Sobrescreve `auth.jwtSecret` |

## Desenvolvimento

### Executar sem instalação global

```bash
# A partir da raiz do projeto
npm install          # instala as dependências (uma vez)
npm start            # equivalente a: node bin/jrs.js run
npm run create       # equivalente a: node bin/jrs.js create <dir>
```

Ou diretamente com Node:

```bash
node bin/jrs.js run
node bin/jrs.js create ./minha-pasta
```

### Testes

```bash
npm test                 # executa a suíte node:test
npm run test:coverage    # com relatório de cobertura
```

### Workflow típico de desenvolvimento

1. `npm run create ./meu-projeto` — gera config, database e pasta storage
2. `cd ./meu-projeto`
3. `npm start` — sobe o servidor com hot-reload possível via `nodemon` (não incluso, mas `node bin/jrs.js run` pode ser observado por ferramentas externas)
4. `npm test` — validações rápidas do comportamento
5. `npm run build` — gera binários standalone (Windows/macOS/Linux) via Node SEA

### Depuração

- Cada requisição é logada por padrão como `[METHOD] /path -> status (duração)`
  no console (ex.: `[GET] /products -> 200 (1ms)`), sem precisar de flag.
- Use `--debug` / `-d` para logs mais detalhados (auth, persistência, socket, erros).
- Veja `src/util/logger.js` para customização dos níveis de log.

## Autenticação

**Ativada por padrão** no `config.yaml` gerado por `create` (o bloco `auth:` é
pré-preenchido com um `jwtSecret`). Você pode desativá-la comentando o bloco
`auth:` — observe que `POST /auth` então retornará um erro claro em vez de um
token.

- `POST /auth` com `{email, password}` (ou `+ admin: true` para `adm_users`)
  retorna `{access_token, refresh_token, type}`.
- `PUT /auth/refresh` troca um refresh token (`nbf = jwtExpire`).
- `GET /me` retorna o usuário logado sem o campo `password`.
- Rotas protegidas exigem `Authorization: Bearer <token>`.
- `auth.urlSkip` e `urlUserPermission` controlam quais rotas não precisam de
  token e quais escritas um usuário comum pode realizar. `enableAdm` restringe
  escritas a administradores.

> **Dica (Postman):** depois de ativar a autenticação, execute a requisição
> *Login* e copie o `access_token` retornado para a variável `{{token}}` da
> coleção, para que as requisições autenticadas funcionem.

## Paginação
Adicione `?page=` a um GET de coleção para receber
`{data, total, page, limit, totalPages}`. Sem isso, o array bruto é retornado.

## Construir o executável standalone

O projeto gera um **binário autocontido** (Single Executable Application via
Node SEA) que roda sem precisar de `node_modules` ou da flag
`--experimental-sea-config`. Ele já traz todo o runtime do Node embutido e o
código do servidor empacotado por `esbuild`.

```bash
npm install
npm run build
# gera dist/json-rest-server(.exe)
```

### Dicas de uso do binário

- **Onde sai:** `dist/json-rest-server` (`.exe` no Windows; sem extensão no
  macOS/Linux).
- **É autocontido:** pode ser copiado para outra máquina que **não** precisa ter
  o Node.js instalado nem as dependências do projeto. Basta colocar `config.yaml`
  e `database.json` em uma pasta e rodar.
- **Uso idêntico ao CLI em Node:** as mesmas variáveis de ambiente (`PORT`,
  `HOST`, `DATABASE_PATH`, `JWT_SECRET`) e flags (`run`, `create`, `--debug`)
  funcionam no binário.

```bash
# Copie o binário para uma pasta vazia e inicialize o projeto
./json-rest-server create
./json-rest-server run
```

- **Build multiplataforma:** cada sistema operacional gera seu próprio binário —
  rode `npm run build` no Windows, macOS e Linux para obter cada versão.
- **CI automática:** os binários para as três plataformas são construídos
  automaticamente no push de tags via `.github/workflows/build-sea.yml` e
  publicados como *release*.

## Licença
Apache-2.0

## Créditos

- **Autor original (Dart):** [Rodrigo Rahman](https://github.com/rodrigorahman) —
  criador do [`json_rest_server`](https://github.com/rodrigorahman/json_rest_server).
- **Port para Node.js:** [Pedro Conrad Junior](https://github.com/pconradjunior) —
  este port foi construído utilizando o **OpenCode** como assistente de IA e o
  **Agente Petrux** como orquestrador/organizador do fluxo de desenvolvimento.

## Aviso de BETA
Este projeto é um port BETA do `json_rest_server` original em Dart. Embora tenha sido testado, pode conter bugs ou diferenças de comportamento em relação ao original. Use com cautela mesmo em ambientes de desenvolvimento e **NÃO USE em ambientes de produção**.

## Disclaimer
Este projeto é fornecido "no estado em que se encontra", sem garantias de qualquer tipo, expressas ou implícitas. O uso é de responsabilidade do usuário. O autor não se responsabiliza por quaisquer danos ou perdas decorrentes do uso deste software.

