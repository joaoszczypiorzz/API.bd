const Database = require('better-sqlite3');
require('dotenv').config(); // 1º - Carrega as variáveis de ambiente
// 2º - Define o caminho (usa a variável do .env, se não existir, usa padrão)
const dbPath = process.env.DATABASE_URL || './loja.db';
// 3º - Conecta ao banco usando a variável
const db = new Database(dbPath);
// Habilitar Foreign Keys (IMPORTANTE no SQLite!)
db.exec('PRAGMA foreign_keys = ON');

// 1. Criar tabela categorias (Apenas se ela não existir)
const createCategorias = `
    CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR(50) NOT NULL UNIQUE,
        descricao TEXT,
        created_at DATETIME DEFAULT (datetime('now', 'localtime'))
    )
`;
db.exec(createCategorias);

// 2. Criar tabela produtos (Apenas se ela não existir)
const createProdutos = `
    CREATE TABLE IF NOT EXISTS produtos (
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

// Criando tabela para Usuários 
const createUsuarios = `
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        senha VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at DATETIME DEFAULT (datetime('now', 'localtime'))
    )
`;
db.exec(createUsuarios);
//Criar índice no email para buscas rápidas
db.exec('CREATE INDEX IF NOT EXISTS idx_email ON usuarios(email)');

// 3. Verificar se já existem dados antes de inserir
// Fazemos um SELECT na tabela de categorias. Se a contagem for 0, o banco está vazio.
const checkData = db.prepare('SELECT COUNT(*) as count FROM categorias').get();

if (checkData.count === 0) {
    console.log('⏳ Banco vazio detectado. Inserindo dados iniciais...');

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

    console.log('✅ Tabelas criadas e dados iniciais inseridos com sucesso!');
} else {
    // Se a contagem não for 0, ele cai aqui e apenas conecta sem mexer nos dados.
    console.log('✅ Banco conectado. Dados já existentes, pulando inserção inicial.');
}

module.exports = db;