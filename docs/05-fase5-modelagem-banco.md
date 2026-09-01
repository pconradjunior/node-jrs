# Fase 5 — Modelagem do Banco

**Projeto:** json-rest-server
**Versao:** 1.0
**Data:** 01/09/2026
**Autor:** Petrux-DBA
**Base:** Requisitos (Fase 1), Arquitetura (Fase 4)

---

## 1. Visao Geral

O "banco de dados" e um arquivo JSON (`database.json`) sem schema rigido — qualquer chave de topo vira uma collection. A modelagem define: (a) o schema do database padrao gerado pelo `create`, (b) convencoes de integridade de dados (IDs, tipos), e (c) regras de persistencia segura.

**Nao aplicavel:** SQL, tabelas relacionais, indices classicos, migracoes DDL. A aplicacao e mock/dev, schema-open, compat sendo o requisito central.

---

## 2. Schema do database.json (modelo de dados)

### 2.1 Formato raiz

```json
{
  "<collectionName>": [ <objeto>, ... ]
}
```

- Cada chave de primeiro nivel = collection.
- Cada collection e um array de objetos (registros).
- Nao ha limite de chaves; criadas livremente pelo usuario no arquivo.

### 2.2 Convencoes por collection

| Collection | Finalidade | Campos essenciais |
|---|---|---|
| `users` | Usuarios comuns (login padrao) | `id`, `email`, `password` |
| `adm_users` | Administradores (login admin) | `id`, `email`, `password` |
| qualquer outra | Dados de negocio do mock | `id` + campos livres |

### 2.3 Contrato do campo `id`

| Propriedade | Regra |
|---|---|
| Obrigatorio | Todo registro POSSUI id |
| Unico dentro da collection | Nao pode haver dois registros com o mesmo id na mesma collection |
| Gerado pelo servidor | POST ignora id enviado pelo client e gera novo |
| Tipo | int (auto-incremental) OU uuid string — conforme `config.idType` |
| Mudanca de tipo | Proibida no meio da operacao; gera erro 409 com mensagem explicativa |

---

## 3. Database Padrao (gerado pelo `create`)

```json
{
  "users": [
    {
      "id": 1,
      "name": "Admin User",
      "email": "admin@admin.com",
      "password": "123"
    },
    {
      "id": 2,
      "name": "Common User",
      "email": "user@user.com",
      "password": "123"
    }
  ],
  "adm_users": [
    {
      "id": 1,
      "name": "Administrator",
      "email": "admin@admin.com",
      "password": "123"
    }
  ],
  "categories": [
    { "id": 1, "name": "Eletronicos" },
    { "id": 2, "name": "Roupas" },
    { "id": 3, "name": "Alimentos" },
    { "id": 4, "name": "Livros" },
    { "id": 5, "name": "Esportes" },
    { "id": 6, "name": "Casa" }
  ],
  "products": [
    { "id": 1, "title": "Smartphone XYZ", "price": 1999.9, "category_id": 1 },
    { "id": 2, "title": "Notebook ABC", "price": 3499.0, "category_id": 1 },
    { "id": 3, "title": "Camiseta Basica", "price": 49.9, "category_id": 2 },
    { "id": 4, "title": "Jaqueta de Couro", "price": 299.0, "category_id": 2 },
    { "id": 5, "title": "Cafe Premium 500g", "price": 32.9, "category_id": 3 },
    { "id": 6, "title": "O Programador Limpo", "price": 89.0, "category_id": 4 },
    { "id": 7, "title": "Bola de Futebol", "price": 79.9, "category_id": 5 },
    { "id": 8, "title": "Jogo de Panelas", "price": 349.0, "category_id": 6 }
  ]
}
```

### 3.1 Relacao products → categories (logica)

- `products.category_id` referencia `categories.id` (int).
- Nao ha FK real (JSON). Integridade e responsabilidade do usuario do mock.
- **Regra de negocio:** enviar `category_id` inexistente nao gera erro — e acao do client. Documentado no README.

### 3.2 Propriedade de demonstracao

- Variedade de tipos nos products: `price` double, `category_id` int, `title` string.
- Permite demonstrar filtros (`?category_id=1`), paginacao e auth de primeira execucao.

---

## 4. Integridade de Dados

### 4.1 Geracao de ID

```
idType = 'int':
  lastId = max(id numerico) da collection (por ordem de insercao)
  novo id = lastId + 1
  se a collection ja contiver id string → erro 409
  (mensagem: "Your id pattern not integer value. Please ensure that you didn't change idType in the middle of your operation")

idType = 'uuid':
  novo id = uuid.v1()
  se a collection ja contiver id int → erro 409
  (mensagem: "Your id pattern not UUID String value. ...")
```

### 4.2 Persistencia segura (atomic write)

```
Fluxo de escrita:
1. memoriaOK (update da copia em memoria)
2. agendar flush (debounce 500ms)
3. flush:
   a. doc = JSON.stringify(db)
   b. escreve em "<database>.tmp"
   c. fsync
   d. rename(tmp → database)   // atomic no mesmo filesystem
4. se falha → rollback da memoria e log de erro
5. no close → flush forcado (imediato)
```

### 4.3 Leitura no startup

```
Se <database> nao existe:
  - create: gera database padrao (secao 3) se nao existir
  - run: se nao existe, cria '{}' (apos load inicial)
Se JSON invalido:
  - log de erro + abort com mensagem orientativa (nao sobrescreve o arquivo corrupto)
```

---

## 5. Valores Padrao Relevantes

| Item | Valor | Onde |
|---|---|---|
| idType | int | config.yaml default |
| users padrao | admin@admin.com / 123, user@user.com / 123 | database.json |
| adm_users padrao | admin@admin.com / 123 | database.json |
| storage folder | storage/ | config.yaml default |
| port | 8080 | config.yaml default |

---

## 6. Criterios de Validacao do Modelo

- [x] Schema compativel 1:1 com database.json do Dart original
- [x] Todo registro tem id unico dentro da collection
- [x] Geracao de id coerente com idType configurado
- [x] Erro 409 em mudanca de idType (sem corromper)
- [x] Escrita atomica evita corrupcao
- [x] Database padrao pronto para login + CRUD de primeira execucao
- [x] Arquivo json invalido nao e sobrescrito automaticamente

---

## 7. Aprovacao

**Aprovado por:** Pedro Conrad Junior
**Data:** ___/___/___
**Status:** Aguardando aprovacao