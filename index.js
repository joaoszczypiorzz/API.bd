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

// GET /api/produtos - Buscar todos com Filtros, Ordenação e Paginação
app.get('/api/produtos', (req, res) => {
    try {
        // Pega todos os query parameters de uma vez, com valores padrão para paginação
        const { 
            categoria, preco_max, preco_min, 
            ordem, direcao,
            pagina = 1, 
            limite = 10
        } = req.query;
        
        let sql = 'SELECT * FROM produtos WHERE 1=1';
        const params = [];
        
        // --- 1. Aplicar Filtros ---
        if (categoria) {
            sql += ' AND categoria = ?';
            params.push(categoria);
        }
        
        if (preco_max) {
            sql += ' AND preco <= ?';
            params.push(parseFloat(preco_max));
        }
        
        if (preco_min) {
            sql += ' AND preco >= ?';
            params.push(parseFloat(preco_min));
        }
        
        // --- 2. Aplicar Ordenação ---
        const camposValidos = ['nome', 'preco', 'categoria', 'created_at'];
        
        if (ordem && camposValidos.includes(ordem)) {
            const dir = (direcao && direcao.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
            sql += ` ORDER BY ${ordem} ${dir}`;
        }
        
        // --- 3. Contar total de registros (ANTES do LIMIT/OFFSET) ---
        // Aqui trocamos o "SELECT *" para descobrir quantos itens existem no total com esses filtros
        let countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
        const countStmt = db.prepare(countSql);
        const { total } = countStmt.get(...params);
        
        // --- 4. Aplicar Paginação ---
        const limiteNum = parseInt(limite);
        const paginaNum = parseInt(pagina);
        const offset = (paginaNum - 1) * limiteNum;
        
        sql += ' LIMIT ? OFFSET ?';
        params.push(limiteNum, offset);
        
        console.log("Query executada:", sql); // 👈 debug para ver no terminal
        
        // --- 5. Executar a busca final ---
        const stmt = db.prepare(sql);
        const produtos = stmt.all(...params);
        
        // --- 6. Retornar dados com os metadados ---
        // Note que agora o JSON de resposta mudou sua estrutura!
        res.json({
            dados: produtos,
            paginacao: {
                pagina_atual: paginaNum,
                itens_por_pagina: limiteNum,
                total_itens: total,
                total_paginas: Math.ceil(total / limiteNum)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro na busca de produtos' });
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

// DELETE /api/produtos/:id - Deletar produto
app.delete('/api/produtos/:id', (req, res) => {
    try {
        // 1. Pegar ID da URL
        const id = parseInt(req.params.id);
        
        // 2. Verificar se produto existe
        const produtoExiste = db.prepare(
            'SELECT * FROM produtos WHERE id = ?'
        ).get(id);
        
        if (!produtoExiste) {
            return res.status(404).json({ 
                erro: 'Produto não encontrado' 
            });
        }
        
        // 3. Executar DELETE
        const stmt = db.prepare('DELETE FROM produtos WHERE id = ?');
        stmt.run(id);
        
        // 4. Retornar 204 No Content
        return res.status(200).json({ mensagem: "Produto apagado com sucesso!"});

    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao deletar' });
    }
});

// PUT /api/produtos/:id - Atualizar produto
app.put('/api/produtos/:id', (req, res) => {
    try {
        // 1. Pegar ID da URL
        const id = parseInt(req.params.id);
        
        // 2. Verificar se produto existe
        const produtoExiste = db.prepare(
            'SELECT * FROM produtos WHERE id = ?'
        ).get(id);
        
        if (!produtoExiste) {
            return res.status(404).json({ 
                erro: 'Produto não encontrado' 
            });
        }
        
        // 3. Pegar dados do body
        const { nome, preco, categoria, estoque } = req.body;
        
        // 4. Validações (mesmas do POST!)
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
        
        // 5. Executar UPDATE
        const stmt = db.prepare(`
            UPDATE produtos 
            SET nome = ?, preco = ?, categoria = ?, estoque = ?
            WHERE id = ?
        `);
        
        stmt.run(nome, preco, categoria, estoque || 0, id);
        
        // 6. Buscar produto atualizado
        const produtoAtualizado = db.prepare(
            'SELECT * FROM produtos WHERE id = ?'
        ).get(id);
        
        // 7. Retornar 200 OK
        res.json(produtoAtualizado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao atualizar' });
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