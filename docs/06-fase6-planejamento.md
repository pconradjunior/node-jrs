# Fase 6 — Planejamento (MESPro)

**Projeto:** json-rest-server
**Versao:** 1.0
**Data:** 01/09/2026
**Autor:** Petrux-Planner (MESPro v2.0)
**Base:** Fases 1-5 aprovadas

---

## 1. Premissas de Estimativa

**Equipe:** 1 profissional **Pleno** (fator senioridade 1.0)
**Métricas-base (configuráveis, calibragem posterior):**
- Simples: 8h
- Mista: 24h
- Complexa: 48h

**Modelo matematico:**
```
Esforço = (FS × 8) + (FM × 24) + (FC × 48)
```

---

## 2. Decomposicao em Entregas e Funcionalidades

### ENTREGA E1 — Scaffold do projeto
| ID | Funcionalidade | Req | Complexidade | Pontos |
|---|---|---|---|---|
| F01 | package.json, bin, entry CLI (commander) | RF-001/002 | Simples | 1 |
| F02 | Estrutura de pastas + modulo paths | RF-001 | Simples | 1 |
| F03 | Logger interno (verbose on/off) | RF-023 | Simples | 1 |
| **Subtotal E1** | | | | **3** |

### ENTREGA E2 — Configuração
| ID | Funcionalidade | Req | Complexidade | Pontos |
|---|---|---|---|---|
| F04 | config-loader (js-yaml) + defaults | RF-021 | Mista | 4 |
| F05 | env overrides (PORT, HOST, DB, JWT_SECRET) | RF-022 | Simples | 2 |
| **Subtotal E2** | | | | **6** |

### ENTREGA E3 — Camada de dados
| ID | Funcionalidade | Req | Complexidade | Pontos |
|---|---|---|---|---|
| F06 | DatabaseRepository (load/getAll/getById/save/update/delete) | RF-003/006/007/008/009/010 | Complexa | 7 |
| F07 | id-generator (int auto-inc + uuid + conflito 409) | RF-007 | Mista | 5 |
| F08 | persistence (debounce 500ms + atomic write) | RNF-003 | Mista | 4 |
| F09 | Templates database padrao (users/adm_users/products/categories) | RF-024 | Simples | 1 |
| **Subtotal E3** | | | | **17** |

### ENTREGA E4 — Servidor HTTP / CRUD
| ID | Funcionalidade | Req | Complexidade | Pontos |
|---|---|---|---|---|
| F10 | Express app + JSON body + cors | RF-026 | Mista | 3 |
| F11 | crud-router dinâmico (:table + :id) completa | RF-003 | Complexa | 8 |
| F12 | Filtros contains case-insensitive (+ #userAuthRef) | RF-004 | Mista | 4 |
| F13 | Paginacao com metadata (?page) + array puro sem page | RF-005 | Mista | 4 |
| F14 | mock-delay middleware | RF-018 | Simples | 1 |
| F15 | error-handler padronizado (sem stack) | RNF-004 | Mista | 3 |
| **Subtotal E4** | | | | **23** |

### ENTREGA E5 — Autenticação
| ID | Funcionalidade | Req | Complexidade | Pontos |
|---|---|---|---|---|
| F16 | jwt helper (generateJWT, getClaims, refreshToken) | RF-011/012 | Complexa | 8 |
| F17 | auth-router (POST /auth, PUT /auth/refresh) | RF-011/012 | Complexa | 7 |
| F18 | auth middleware (token, urlSkip, wildcard, admin, urlUserPermission) | RF-014 | Complexa | 8 |
| F19 | me-router (GET /me, remove password) | RF-013 | Mista | 3 |
| F20 | authFields customizados (string/int/double) | RF-011 | Mista | 4 |
| **Subtotal E5** | | | | **30** |

### ENTREGA E6 — Broadcast
| ID | Funcionalidade | Req | Complexidade | Pontos |
|---|---|---|---|---|
| F21 | broadcast controller (+ payload {channel,table,data}) | RF-015 | Mista | 4 |
| F22 | tcp-server (net, socketPort dedicado) | RF-017 | Mista | 4 |
| F23 | ws-server (upgrade HTTP, filtro ?tables) | RF-016 | Mista | 5 |
| F24 | integracao broadcast nos verbos de escrita | RF-015 | Mista | 3 |
| **Subtotal E6** | | | | **16** |

### ENTREGA E7 — Storage & Upload
| ID | Funcionalidade | Req | Complexidade | Pontos |
|---|---|---|---|---|
| F25 | storage-router (static files) | RF-019 | Simples | 2 |
| F26 | upload-router (multer) | RF-020 | Mista | 4 |
| **Subtotal E7** | | | | **6** |

### ENTREGA E8 — CLI commands
| ID | Funcionalidade | Req | Complexidade | Pontos |
|---|---|---|---|---|
| F27 | create command (config.yaml + database + storage) | RF-001/024 | Mista | 4 |
| F28 | run command (start/stop, URLs exibidas) | RF-002 | Mista | 4 |
| **Subtotal E8** | | | | **8** |

### ENTREGA E9 — Testes
| ID | Funcionalidade | Req | Complexidade | Pontos |
|---|---|---|---|---|
| F29 | Testes unitarios (config, id-gen, database, jwt) | RNF-008 | Mista | 4 |
| F30 | Testes integracao CRUD + paginacao + filtro | RNF-008 | Mista | 5 |
| F31 | Testes integracao auth (/auth, /me, refresh, skip) | RNF-008 | Mista | 5 |
| F32 | Testes broadcast (tcp + ws + filtro tables) + upload | RNF-008 | Mista | 5 |
| F33 | Testes CLI (create/run) | RNF-008 | Mista | 3 |
| **Subtotal E9** | | | | **22** |

### ENTREGA E10 — Build & Documentação
| ID | Funcionalidade | Req | Complexidade | Pontos |
|---|---|---|---|---|
| F34 | build-sea script + sea-config.json | RF-025 | Mista | 4 |
| F35 | GitHub Actions matrix (win/mac/linux) | RF-025 | Mista | 4 |
| F36 | README + CHANGELOG + example postman | RF-025/F10 | Mista | 3 |
| **Subtotal E10** | | | | **11** |

---

## 3. Classificacao Resumida

| Categoria | Qtd | Pontos |
|---|---|---|
| **Simples** (FS) | 8 | — |
| **Mista** (FM) | 20 | — |
| **Complexa** (FC) | 4 | — |
| **Total funcionalidades** | **32** | **142 pontos** |

---

## 4. Calculo de Esforco

```
Esforço = (8 × 8h) + (20 × 24h) + (4 × 48h)
        =  64h  +  480h  +  192h
        =  736h  (esforço base)
```

### 4.1 Fatores de ajuste

| Fator | Valor | Justificativa |
|---|---|---|
| Margem de risco | +20% | Projeto de port; edge cases de compatibilidade |
| Senioridade | 1.0 (Pleno) | Equipe assumida pleno |
| Disponibilidade | 100% (dedicado) | Sem fator adicional |
| Buffer de flusso/contexto | 0h | Session contínua |

```
Esforço ajustado = 736h × 1.20 = 883h
```

### 4.2 Jornada e dias

```
Jornada diaria efetiva (cluster): 6h/dia (foco, sem interrupcoes)
Dias uteis/semana: 5
Dias estimados = 883h / 6h = 147,2 → ~148 dias
```

---

## 5. Cenarios (Otimista / Realista / Pessimista)

| Cenario | Percentual | Esforco | Dias (6h/dia) | Semanas |
|---|---|---|---|---|
| **Otimista** | -20% sobre ajuste | 706h | ~118 | 23.6 |
| **Realista** | linha base | 883h | ~148 | 29.6 |
| **Pessimista** | +25% sobre ajuste | 1104h | ~184 | 36.8 |

**Plano adotado:** **Realista = ~29 semanas** (inclui testes, docs e build).

> Observacao: o esforco inclui Fase 7 (implementacao), Fase 8 (testes), Fase 9 (revisao), Fase 10 (docs) e Fase 11 (publicacao). Estimativa e em horas de engenharia; pode ser reduzida com paralelizacao (mais de 1 profissional) ou se cortadas funcionalidades Should.

---

## 6. Ordem de Implementacao (Sequencia)

**Baseada em dependencias entre entregas:**

```
E1 Scaffold → E2 Config → E3 Dados → E4 HTTP/CRUD
   → E5 Auth → E6 Broadcast → E7 Storage/Upload
   → E8 CLI completa → E9 Testes → E10 Build/Docs
```

Racional:
- E1-E3 antes de tudo (base).
- E4 antes de E5 (auth protege rotas CRUD).
- E5 antes de E6 (broadcast depende de verbos + tokens ja funcionais).
- E8 (create/run) pode ser parcial desde E1; a rotina final apos E3-E7.
- E9 (testes) ao final de cada entrega na realidade; consolidado como entrega.
- E10 (build SEA) apos codigo estavel.

---

## 7. Marcos (Milestones)

| Marco | Entregas | Criterio de conclusao | Semana est. |
|---|---|---|---|
| **M1: Núcleo iniciavel** | E1+E2+E3+E4(+E8-run basico) | `jrs run` sobe HTTP e CRUD funciona | 13 |
| **M2: Auth completa** | E5 | login/refresh/me/protecao funcionais | 18 |
| **M3: Tempo real + arquivos** | E6+E7 | WS/TCP broadcast + upload/static | 23 |
| **M4: CLI completa + storage config** | E8 (create completo) | create gera database padrao | 24 |
| **M5: Qualidade** | E9 | cobertura >= 80%, testes verdes | 28 |
| **M6: Release** | E10 | binarios win/mac/linux + README | 29 |

---

## 8. Riscos do Cronograma

| Risco | Impacto | Mitigacao |
|---|---|---|
| Compatibilidade com edge cases Dart exige iteracao | +2 sem | Testes de regressao precoces no M1 |
| Node SEA: assets/templates no binario | +1 sem | Templates como strings; validar cedo (M6) |
| Filtro ?tables do WS mal interpretado | +0.5 sem | Testes de integracao no M3 |
| Multer x SEA asset path | +0.5 sem | path resolvido via process.cwd() |
| Escopo Should cresce no MVP | variavel | Congelar MVP no M1; Should apenas se folga |

---

## 9. Criterios de Aceite do Plano

- [x] Projeto decomposto em entregas e funcionalidades (32 funcionalidades)
- [x] Complexidades classificadas por criterios objetivos
- [x] Esforco calculado pelo modelo MESPro (736h base → 883h ajustado)
- [x] Fatores aplicados (risco 20%, senioridade pleno)
- [x] Cenarios otimista/realista/pessimista gerados
- [x] Sequencia e milestones definidos
- [x] Riscos e mitigacoes registrados

---

## 10. Aprovacao

**Aprovado por:** Pedro Conrad Junior
**Data:** ___/___/___
**Status:** Aguardando aprovacao