// 1. Importar Express
const express = require('express');
const db = require('./database'); //importando require para o Banco de dados 

// 2. Criar aplicação
const app = express();
app.use(express.json()); 

// 1. Preparar query (com ? como placeholders)
const stmt = db.prepare('SELECT * FROM produtos WHERE id = ?');

// 2. Executar com valores
const produto = stmt.get(1);  // Retorna 1 linha

// Múltiplos placeholders:
const stmt2 = db.prepare(
    'SELECT * FROM produtos WHERE categoria = ? AND preco < ?'
);
const produtos = stmt2.all('Informática', 1000);  // Retorna array

// GET /api/produtos - Listar todos
app.get('/api/produtos', (req, res) => {
    try {
        // Preparar query
        const stmt = db.prepare('SELECT * FROM produtos');
        
        // Executar e pegar todos os resultados
        const produtos = stmt.all();
        
        // Retornar array (pode ser vazio [])
        res.json(produtos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar produtos' });
    }
});

// GET /api/produtos/:id - Buscar por ID
app.get('/api/produtos/:id', (req, res) => {
    try {
        // 1. Pegar ID da URL
        const id = parseInt(req.params.id);
        
        // 2. Preparar query com WHERE
        const stmt = db.prepare('SELECT * FROM produtos WHERE id = ?');
        
        // 3. Executar (retorna 1 objeto ou undefined)
        const produto = stmt.get(id);
        
        // 4. Verificar se encontrou
        if (!produto) {
            return res.status(404).json({ 
                erro: 'Produto não encontrado' 
            });
        }
        
        // 5. Retornar produto
        res.json(produto);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar produto' });
    }
});

// POST /api/produtos - Criar produto
app.post('/api/produtos', (req, res) => {
    try {
        // 1. Pegar dados do body
        const { nome, preco, categoria, estoque = 0 } = req.body;
        
        // 2. Validações (igual antes!)
        if (!nome || !preco || !categoria) {
            return res.status(400).json({ 
                erro: 'Campos obrigatórios faltando' 
            });
        }
        
        if (typeof preco !== 'number' || preco <= 0) {
            return res.status(400).json({ 
                erro: 'Preço inválido' 
            });
        }
        
        // 3. Preparar INSERT
        const stmt = db.prepare(`
            INSERT INTO produtos (nome, preco, categoria, estoque)
            VALUES (?, ?, ?, ?)
        `);
        
        // 4. Executar INSERT
        const result = stmt.run(nome, preco, categoria, estoque);
        
        // 5. Pegar ID gerado
        const id = result.lastInsertRowid;
        
        // 6. Buscar produto criado (para retornar completo)
        const produtoCriado = db.prepare(
            'SELECT * FROM produtos WHERE id = ?'
        ).get(id);
        
        // 7. Retornar 201 Created
        res.status(201).json(produtoCriado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao criar produto' });
    }
});

// 3. Definir porta
const PORT = 3000;

// 5. Criar primeiro endpoint
app.get('/', (req, res) => {
    res.json({
        mensagem: '🎉 API funcionando com sucesso!',
        status: 'sucesso',
        timestamp: new Date().toISOString()
    });
});

// 6. Endpoint de informações
app.get('/info', (req, res) => {
    res.json({
        nome: 'Minha API REST',
        versao: '1.0.0',
        autor: 'João Szczypior'
    });
});

// 7. Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});