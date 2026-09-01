# Fase 2 — Analise Tecnica

**Projeto:** json-rest-server
**Versao:** 1.0
**Data:** 01/09/2026
**Autor:** Petrux-Analyst
**Base:** Documento de requisitos (Fase 1) aprovado

---

## 1. Objetivo da Analise

Avaliar em profundidade as alternativas tecnicas para o port Node.js, validar a abordagem escolhida e classificar os requisitos por valor/esforco (MoSCoW). A saida alimenta a Decomposicao (Fase 3) e a Arquitetura (Fase 4).

---

## 2. Priorizacao dos Requisitos (MoSCoW)

### 2.1 Must Have (MVP obrigatorio)

| Req | Funcionalidade | Justificativa |
|---|---|---|
| RF-001 | CLI create | Entrada do produto |
| RF-002 | CLI run | Nucelo do produto |
| RF-003 | CRUD automatico | Proposta central |
| RF-004 | Filtros | Uso diario |
| RF-005 | Paginacao + metadata | Uso diario |
| RF-006 | GET by ID | CRUD |
| RF-007 | POST | CRUD |
| RF-008 | PUT | CRUD |
| RF-009 | PATCH | CRUD |
| RF-010 | DELETE | CRUD |
| RF-011 | JWT Login | Auth essencial |
| RF-012 | Refresh token | Sessao continua |
| RF-013 | /me | Identidade |
| RF-014 | Auth middleware | Protecao rotas |
| RF-016 | WebSocket | Tempo real essencial |
| RF-017 | Socket TCP | Compatibilidade original |
| RF-021 | Config YAML | Base do sistema |
| RF-024 | Dados padrao create | Primeira experiencia |
| RF-025 | Build multiplataforma | Forma de distribuicao |
| RF-026 | CORS | Consumo por apps |

### 2.2 Should Have (importante, contornavel no MVP)

| Req | Funcionalidade | Justificativa |
|---|---|---|
| RF-015 | Broadcast controller | Necessario para WS/TCP funcionarem em conjunto |
| RF-019 | Static files | Util para imagens, contornavel |
| RF-020 | Upload | Diferencial, contornavel |
| RF-022 | Env vars overrides | DX, contornavel |
| RF-023 | Log interno | DX, contornavel |

### 2.3 Could Have (desejavel, se sobrar tempo)

| Req | Funcionalidade | Justificativa |
|---|---|---|
| RF-018 | Mock delay | Util para testes de UX, nao bloqueante |

### 2.4 Won't Have (fora do MVP)

| Req | Funcionalidade | Justificativa |
|---|---|---|
| F27 | Slack integration | Plugin opcional, pos-v1.0 |
| F28 | CLI upgrade | Atualizacao via npm |
| F29 | CLI version | Trivial |
| F30 | CORS configuravel | Padrao ja funciona |
| F32 | Healthcheck | Nao bloqueante |
| F33 | Rate limiting | Seguranca, nao MVP |
| F34 | HTTPS/TLS | Dev local |

---

## 3. Analise de Alternativas em Profundidade

### 3.1 Módulo HTTP: Express.js vs Fastify vs http nativo

**Requisito atendido:** RF-003 a RF-010 (CRUD), RF-026 (CORS)

**Comparacao detalhada:**

| Criterio | Express | Fastify | http nativo |
|---|---|---|---|
| Curva de aprendizado | Baixa | Media | Alta |
| Middleware maduro (multer, cors) | Sim | Sim (via plugins) | Nao |
| Performance (req/s) | ~10k/s | ~25k/s | ~35k/s |
| Schema validation | Nao nativo | Nativo (JSON Schema) | Nao |
| Extensibilidade | Grande ecossistema | Ecossistema crescente | Manual |
| Familiaridade da equipe | Alta (padrao industria) | Media | Baixa |

**Decisao:** Express.js
**Justificativa:** O produto nao e critico de performance (dev/mock), mas sim de produtividade. O ecossistema Express reduz custo de middleware (cors, multer, morgan), mantendo modularidade suficiente. Fastify traria schema validation, porem adiciona curva e o volume de dados do database.json nao justifica.

**Risco:** Performance limita a ~10k req/s. Mitigacao: para mock dev, sobra folga (cenario real e dezenas de usuarios).

---

### 3.2 Persistencia: JSON direto vs lowdb vs SQLite (better-sqlite3)

**Requisito atendido:** RF-003 (CRUD), RNF-003 (debounce)

**Comparacao detalhada:**

| Criterio | JSON direto | lowdb | better-sqlite3 |
|---|---|---|---|
| Compatibilidade formato Dart | 100% | 100% | Quebra (SQL) |
| Dependencias | Zero | 1 | 1 (nativo) |
| Concorrencia | Manual (debounce) | Gerencia | Nativa |
| Volume suportado | Pequeno | Medio | Grande |
| Build SEA (native modules) | Ok | Ok | Problematice (prebuilt) |
| Conceito | Simples | Simples | Complexo |

**Decisao:** JSON direto + debounce em memoria
**Justificativa:** Preserva 100% de compatibilidade com o database.json do Dart (requisito RNF-005), zero dependencias (facilita build SEA) e o volume de dados de uso em dev e pequeno. O debounce de 500ms resolve o problema de I/O excessivo.

**Risco:** Arquivos grandes (>50MB) consomem RAM e lentificam busca. Mitigacao: documentar limite de uso para dev/prototipo; buscar com for-of (sem criar subarrays).

---

### 3.3 Autenticacao: jsonwebtoken vs jose vs hand-rolled

**Requisito atendido:** RF-011 a RF-014

**Comparacao detalhada:**

| Criterio | jsonwebtoken | jose | hand-rolled |
|---|---|---|---|
| Maduridade | Alta | Alta | Baixa |
| ESM/CommonJS | Ambas | ESM-first | N/A |
| Circulacao de segredos | Direta | Wealth | Manual |
| Compliance cripto | Boa | Excelente | Risco |
| Compatibilidade HS256 | Sim | Sim | Sim |
| Size | ~49KB | ~80KB | Zero |

**Decisao:** jsonwebtoken
**Justificativa:** HS256 compativel com o jaguar_jwt do Dart, API simples e madura, CommonJS nativo (facil para SEA e para o estilo do projeto). jose e mais moderno/seguro (alg ambig.) mas o formato de claims do original (iss, sub, adm, exp, iat, nbf) e totalmente atendido pelo jsonwebtoken.

**Risco:** jsonwebtoken nao impede `alg: none` externo. Mitigacao: sempre fornecer secret explicito e nao aceitar options de includes de public key.

---

### 3.4 CLI: commander vs yargs vs minimist

**Requisito atendido:** RF-001, RF-002, RF-023

| Criterio | commander | yargs | minimist |
|---|---|---|---|
| Subcomandos | Nativo | Nativo | Manual |
| Flags com tipo | Sim | Sim | Manual |
| Help automatico | Sim | Sim | Nao |
| Popularidade | Alta | Alta | Media |
| Manutencao | Ativa | Ativa | Baixa |
| Size | ~30KB | ~295KB | ~5KB |

**Decisao:** commander
**Justificativa:** Subcomandos (create, run), flags tipadas (--verbose) e help automatico, com manutencao ativa e tamanho compacto. yargs e robusto mas pesado para 2 comandos; minimist exigiria implementacao de help.

---

### 3.5 YAML parsing: js-yaml vs yaml

**Requisito atendido:** RF-021

| Criterio | js-yaml | yaml pkg |
|---|---|---|
| Maduridade | Alta | Alta |
| Compatibilidade schema Dart | Mapeamento manual | Mapeamento manual |
| CommonJS | Sim | Sim |
| Comment/merge sua | Parcial | Completo |
| Manutencao | Alta (ativa) | Alta |

**Decisao:** js-yaml
**Justificativa:** Compatibilidade com YAML 1.x (mesmo usado pelo Dart `yaml` package), CommonJS nativo e API simples. O `yaml` pkg trata YAML 1.2 mais completo, mas o schema do config.yaml e simples (maps e listas aninhadas).

---

### 3.6 WebSocket / Socket: ws + net vs socket.io

**Requisito atendido:** RF-015, RF-016, RF-017

| Criterio | ws + net | socket.io |
|---|---|---|
| Protocolo compativel com original | Sim | Nao |
| Dependencias | 1 (ws) | 2 (server+client) |
| Filtro por tabela | Manual (query) | Manual (room) |
| Enderaco na mesma porta do HTTP | Sim | Sim |
| Peso | ~110KB | ~200KB+ |

**Decisao:** ws + net nativo
**Justificativa:** Compatibilidade com o formato do original (JSON em canais), filtro por tabela via query string igual ao Dart e socket TCP via modulo nativo `net`. socket.io mudaria o protocolo e quebraria clientes existentes.

---

### 3.7 Upload: multer vs busboy vs formidable

**Requisito atendido:** RF-020

| Criterio | multer | busboy | formidable |
|---|---|---|---|
| Integracao Express | Nativa | Manual | Manual |
| Disk storage | Sim | Manual | Sim |
| API | Simples | Baixo nivel | Media |
| Manutencao | Alta | Alta | Baixa |

**Decisao:** multer
**Justificativa:** Integracao nativa com Express, disk storage pronto e API simples. Exatamente o padrao da industria.

---

### 3.8 Build standalone: Node SEA vs pkg vs nexe vs Bun compile

**Requisito atendido:** RF-025

| Criterio | Node SEA | pkg | nexe | Bun compile |
|---|---|---|---|---|
| Node oficial | Sim | Nao | Nao | Nao (Bun) |
| Manutencao | Ativa | Descontinuado | Baixa | Ativa |
| Native modules | Limitado | Suporte | Suporte | Limitado |
| Cross-compile | Nao (build por SO) | Sim (sem cross) | Nao | Nao |
| Inserir assets | Sim (blob) | Sim | Sim | Sim |
| Runtime | Node LTS | Node (antigo) | Node | Bun |

**Decisao:** Node SEA
**Justificativa:** Oficial do Node (>=20), sem dependencia descontinuada (pkg), e nossos assets (config.yaml, database.json templates) cabem no blob. Build por plataforma e feito via GitHub Actions (matrix OS), sem cross-compile necessario.

**Risco:** SEA nao suporta dependencias nativas compiladas. Mitigacao: nossa stack (express, jsonwebtoken, ws, multer, js-yaml, commander) e 100% JS puro — sem native modules.

---

### 3.9 Estrutura de modulo: CommonJS vs ESM

| Criterio | CommonJS | ESM |
|---|---|---|
| Compatibilidade Node SEA | Total | Total |
| Dependencias (todas acima) | Total | Total |
| Dynamic import | Facil (require) | Easy (import) |
| __dirname | Nativo | Precisa import.meta |
| Estilo da maioria das libs | Sim | Parcial |
| Ferramentas de build | Simples | Configuracao |

**Decisao:** CommonJS
**Justificativa:** Todas as libs escolhidas sao CommonJS-first, simplifica o build SEA (blob unico) e evita complexidade de import.meta. E ainda facilita scripts de teste e CI.

---

### 3.10 Testes: jest vs vitest vs node:test

**Requisito atendido:** RNF-008

| Criterio | jest | vitest | node:test |
|---|---|---|---|
| Dependencias | Muitas | Muitas | Zero (nativa) |
| Supertest/API test | Sim | Sim | Sim |
| Setup | Config | Config | Zero |
| Velocidade | Media | Rapida | Media |
| Coverage | Sim | Sim | Sim (nativo) |
| Node SEA build | Nao impacta* | Nao impacta | Nao impacta |

**Decisao:** node:test (modulo nativo) + supertest
**Justificativa:** Zero dependencia extra, coverage integrado (node --experimental-test-coverage em Node 20, --test nativo), e reduce espaco do build. supertest facilita testar rotas Express sem subir porta real.

---

## 4. Matriz Valor vs Esforco

| Funcionalidade | Valor | Esforco | Quadrante | Acao |
|---|---|---|---|---|
| CRUD automatico | Alto | Medio | Quick win | MVP |
| Filtros | Alto | Baixo | Quick win | MVP |
| Paginacao metadata | Alto | Baixo | Quick win | MVP |
| JWT login/refresh | Alto | Medio | Fazer primeiro | MVP |
| /me + admin | Alto | Baixo | Quick win | MVP |
| WebSocket | Alto | Medio | Fazer primeiro | MVP |
| Socket TCP | Medio | Medio | Normal | MVP |
| Build SEA | Alto | Medio (CI) | Fazer primeiro | MVP |
| Mock delay | Baixo | Baixo | Se sobrar tempo | Could |
| Upload | Alto | Medio | Fazer primeiro | Should |
| Static files | Medio | Baixo | Fazer primeiro | Should |
| Log interno | Medio | Baixo | Fazer primeiro | Should |
| Slack | Baixo | Medio | Evitar | Won't |
| Rate limiting | Medio | Medio | Adiar | Won't |
| Ordenacao (_sort) | Medio | Baixo | Adiar | Won't |

---

## 5. Tendencias Contraditorias (Conflitos)

| Conflito | Decisao | Justificativa |
|---|---|---|
| 200 vs 201 para POST | Manter 200 | Compatibilidade com clientes Dart |
| metadata vs array na paginacao | Metadata quando `page` presente | Backwards-compat + valor |
| 200 vs 404 no DELETE inexistente | Manter 200 | Comportamento original |
| JSON puro vs SQLite | JSON puro | Compatibilidade database.json |
| bcrypt vs plaintext | Plaintext | Decisao do produto (dev/teste) |

---

## 6. Decisoes Confirmadas

1. **runtime/módulo:** Node >=20, CommonJS
2. **HTTP:** Express.js
3. **Auth:** jsonwebtoken (HS256)
4. **CLI:** commander
5. **YAML:** js-yaml
6. **WS:** ws + net (nativo)
7. **Upload:** multer
8. **Build:** Node SEA (CI matrix OS)
9. **Log:** morgan (controlado por --verbose/config)
10. **Persistencia:** JSON direto + debounce 500ms
11. **Testes:** node:test + supertest
12. **UUID:** uuid (v1, para compatibilidade com original)

---

## 7. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|---|---|---|---|
| Segredo JWT default fraco | Alta | Medio | Gerar/validar secret; env JWT_SECRET; aviso em run |
| Concorrencia no arquivo JSON | Media | Alto | Debounce + escrita atomica (tmp+rename) |
| Arquivo JSON grande | Media | Medio | Documentar limite; busca sem subarray |
| SEA: binario grande | Media | Baixo | Compressao; revisar incluidas |
| Compatibilidade edge cases (idType mudanca) | Baixa | Medio | Testes de regressao contra comportamento Dart |
| webSocket filtro exclusivo mal entendido | Media | Baixo | Documentacao clara no README |

---

## 8. Conclusao

A abordagem escolhida atende aos requisitos com stack 100% JS (facilita Node SEA) e mantem compatibilidade total com o formato do projeto Dart original. Express + jsonwebtoken + ws cobrem todo o escopo com baixo risco e custo de manutencao reduzido.

**MVP ajustado:** os requisitos Must + Should compoem o MVP. Mock delay (Could) fica para implementacao imediata se houver folga, sem bloquear.

---

## 9. Aprovacao

**Aprovado por:** Pedro Conrad Junior
**Data:** ___/___/___
**Status:** Aguardando aprovacao