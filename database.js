const Database = require('better-sqlite3');
const db = new Database('loja.db');

// Habilitar Foreign Keys (IMPORTANTE no SQLite!)
db.exec('PRAGMA foreign_keys = ON');

// 🚀 GARANTIA DE LIMPEZA: Apaga as tabelas antigas se existirem
db.exec('DROP TABLE IF EXISTS produtos');
db.exec('DROP TABLE IF EXISTS categorias');

// 1. Criar tabela categorias
const createCategorias = `
    CREATE TABLE categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR(50) NOT NULL UNIQUE,
        descricao TEXT,
        created_at DATETIME DEFAULT (datetime('now', 'localtime'))
    )
`;
db.exec(createCategorias);

// 2. Criar tabela produtos (com a coluna nova: categoria_id)
const createProdutos = `
    CREATE TABLE produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR(100) NOT NULL,
        preco DECIMAL(10,2) NOT NULL,
        estoque INTEGER DEFAULT 0,
        categoria_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT (datetime('now', 'localtime')),
        
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
            ON DELETE RESTRICT
            ON UPDATE CASCADE
    )
`;
db.exec(createProdutos);

console.log('✅ Banco limpo e tabelas criadas com relacionamento!');

// Inserir categorias
const categorias = [
    { nome: 'Informática', descricao: 'Produtos de tecnologia' },
    { nome: 'Livros', descricao: 'Livros e publicações' },
    { nome: 'Eletrônicos', descricao: 'Aparelhos eletrônicos' }
];

const stmtCat = db.prepare('INSERT INTO categorias (nome, descricao) VALUES (?, ?)');
categorias.forEach(cat => stmtCat.run(cat.nome, cat.descricao));

// Inserir produtos
const produtos = [
    { nome: 'Notebook Dell', preco: 3500, estoque: 10, categoria_id: 1 },
    { nome: 'Mouse Logitech', preco: 150, estoque: 50, categoria_id: 1 },
    { nome: 'JavaScript: The Good Parts', preco: 89, estoque: 30, categoria_id: 2 }
];

const stmtProd = db.prepare('INSERT INTO produtos (nome, preco, estoque, categoria_id) VALUES (?, ?, ?, ?)');
produtos.forEach(p => stmtProd.run(p.nome, p.preco, p.estoque, p.categoria_id));

console.log('✅ Dados iniciais inseridos com sucesso!');

module.exports = db;