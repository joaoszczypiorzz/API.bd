// database.js
const Database = require('better-sqlite3');

// Criar/abrir banco de dados
const db = new Database('produtos.db');

// Criar tabela se não existir
const createTableSQL = `
    CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR(100) NOT NULL,
        preco DECIMAL(10,2) NOT NULL,
        categoria VARCHAR(50) NOT NULL,
        estoque INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT (datetime('now', 'localtime'))
    )
`;

db.exec(createTableSQL);

console.log('✅ Banco de dados conectado!');

// Exportar para usar em outros arquivos
module.exports = db;