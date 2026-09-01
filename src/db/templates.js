'use strict';

const configTemplate = `name: Json Rest Server
port: 8080
host: 0.0.0.0
database: database.json
idType: int
enableSocket: true
socketPort: 8081
broadcastProvider: socket,websocket #socket,websocket,slack
storage:
  folder: storage/
# slack:
#   slackUrl: '' #your webhook url from slack
#   slackChannel: '' #your channel starting with #
auth:
  jwtSecret: cwsMXDtuP447WZQ63nM4dWZ3RppyMl
  jwtExpire: 3600
  unauthorizedStatusCode: 403
  # enableAdm: true
  # urlUserPermission:
  #   - /students
  urlSkip:
    - /users:
        method: post
    - /products:
        method: get
    - /products/{*}:
        method: get
`;

const databaseTemplate = {
  users: [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@admin.com',
      password: '123',
    },
    {
      id: 2,
      name: 'Common User',
      email: 'user@user.com',
      password: '123',
    },
  ],
  adm_users: [
    {
      id: 1,
      name: 'Administrator',
      email: 'admin@admin.com',
      password: '123',
    },
  ],
  categories: [
    { id: 1, name: 'Eletronicos' },
    { id: 2, name: 'Roupas' },
    { id: 3, name: 'Alimentos' },
    { id: 4, name: 'Livros' },
    { id: 5, name: 'Esportes' },
    { id: 6, name: 'Casa' },
  ],
  products: [
    { id: 1, title: 'Smartphone XYZ', price: 1999.9, category_id: 1 },
    { id: 2, title: 'Notebook ABC', price: 3499.0, category_id: 1 },
    { id: 3, title: 'Camiseta Basica', price: 49.9, category_id: 2 },
    { id: 4, title: 'Jaqueta de Couro', price: 299.0, category_id: 2 },
    { id: 5, title: 'Cafe Premium 500g', price: 32.9, category_id: 3 },
    { id: 6, title: 'O Programador Limpo', price: 89.0, category_id: 4 },
    { id: 7, title: 'Bola de Futebol', price: 79.9, category_id: 5 },
    { id: 8, title: 'Jogo de Panelas', price: 349.0, category_id: 6 },
  ],
};

module.exports = { configTemplate, databaseTemplate };