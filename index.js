const express = require('express');
const db = require('./database'); 

const app = express();
app.use(express.json()); 

// TESTES INICIAIS (Atualizados para usar categoria_id)
const stmt = db.prepare('SELECT * FROM produtos WHERE id = ?');
const produto = stmt.get(1);  

const stmt2 = db.prepare('SELECT * FROM produtos WHERE categoria_id = ? AND preco < ?');
const produtosTeste = stmt2.all(1, 4000);  

// GET /api/produtos - Buscar todos (Filtros, Ordenação, Paginação e JOIN com Categorias)
app.get('/api/produtos', (req, res) => {
    try {
        const { 
            categoria_id, preco_max, preco_min, 
            ordem, direcao,
            pagina = 1, limite = 10
        } = req.query;
        
        // 1. Separar a base do SQL para poder usar tanto na busca quanto no COUNT
        const baseQuery = `
            FROM produtos p
            INNER JOIN categorias c ON p.categoria_id = c.id
            WHERE 1=1
        `;
        
        let filtros = '';
        const paramsFiltros = []; // Parâmetros apenas do WHERE
        
        // --- 2. Aplicar Filtros (usando p. para referenciar a tabela produtos) ---
        if (categoria_id) {
            filtros += ' AND p.categoria_id = ?';
            paramsFiltros.push(parseInt(categoria_id));
        }
        if (preco_max) {
            filtros += ' AND p.preco <= ?';
            paramsFiltros.push(parseFloat(preco_max));
        }
        if (preco_min) {
            filtros += ' AND p.preco >= ?';
            paramsFiltros.push(parseFloat(preco_min));
        }
        
        // --- 3. Contar total de registros (para a paginação) ---
        const countSql = `SELECT COUNT(*) as total ` + baseQuery + filtros;
        const countStmt = db.prepare(countSql);
        const { total } = countStmt.get(...paramsFiltros);
        
        // --- 4. Aplicar Ordenação ---
        let ordemSql = '';
        const camposValidos = ['nome', 'preco', 'categoria_id', 'created_at'];
        
        if (ordem && camposValidos.includes(ordem)) {
            const dir = (direcao && direcao.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
            // Usa p.ordem para garantir que vai ordenar usando a tabela de produtos
            ordemSql += ` ORDER BY p.${ordem} ${dir}`; 
        } else {
            // Ordenação padrão se não mandarem nada
            ordemSql += ` ORDER BY p.nome ASC`;
        }
        
        // --- 5. Aplicar Paginação ---
        const limiteNum = parseInt(limite);
        const paginaNum = parseInt(pagina);
        const offset = (paginaNum - 1) * limiteNum;
        
        let paginacaoSql = ' LIMIT ? OFFSET ?';
        // Junta os parâmetros dos filtros com os da paginação
        const paramsFinais = [...paramsFiltros, limiteNum, offset]; 
        
        // --- 6. Montar o SELECT final completo e executar ---
        const selectCampos = `
            SELECT 
                p.id, p.nome, p.preco, p.estoque, p.created_at,
                c.id AS categoria_id,
                c.nome AS categoria_nome,
                c.descricao AS categoria_descricao
        `;
        
        const sqlFinal = selectCampos + baseQuery + filtros + ordemSql + paginacaoSql;
        const execStmt = db.prepare(sqlFinal);
        const produtosRaw = execStmt.all(...paramsFinais);
        
        // --- 7. Reformatar os dados para aninhar a categoria ---
        const produtosFormatados = produtosRaw.map(p => ({
            id: p.id,
            nome: p.nome,
            preco: p.preco,
            estoque: p.estoque,
            categoria: {
                id: p.categoria_id,
                nome: p.categoria_nome,
                descricao: p.categoria_descricao
            },
            created_at: p.created_at
        }));
        
        // --- 8. Retornar resposta JSON ---
        res.json({
            dados: produtosFormatados,
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
        const id = parseInt(req.params.id);
        const queryStmt = db.prepare('SELECT * FROM produtos WHERE id = ?');
        const produtoEncontrado = queryStmt.get(id);
        
        if (!produtoEncontrado) return res.status(404).json({ erro: 'Produto não encontrado' });
        res.json(produtoEncontrado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar produto' });
    }
});

// POST /api/produtos - Criar produto
app.post('/api/produtos', (req, res) => {
    try {
        const { nome, preco, categoria_id, estoque = 0 } = req.body;
        
        if (!nome || !preco || !categoria_id) {
            return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
        }
        if (typeof preco !== 'number' || preco <= 0) {
            return res.status(400).json({ erro: 'Preço inválido' });
        }
        
        const insertStmt = db.prepare(`
            INSERT INTO produtos (nome, preco, categoria_id, estoque)
            VALUES (?, ?, ?, ?)
        `);
        const result = insertStmt.run(nome, preco, categoria_id, estoque);
        
        const produtoCriado = db.prepare('SELECT * FROM produtos WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(produtoCriado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao criar produto' });
    }
});

// DELETE /api/produtos/:id - Deletar produto
app.delete('/api/produtos/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const produtoExiste = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
        
        if (!produtoExiste) return res.status(404).json({ erro: 'Produto não encontrado' });
        
        db.prepare('DELETE FROM produtos WHERE id = ?').run(id);
        return res.status(200).json({ mensagem: "Produto apagado com sucesso!"});
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao deletar' });
    }
});

// PUT /api/produtos/:id - Atualizar produto
app.put('/api/produtos/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const produtoExiste = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
        
        if (!produtoExiste) return res.status(404).json({ erro: 'Produto não encontrado' });
        
        const { nome, preco, categoria_id, estoque } = req.body;
        
        if (!nome || !preco || !categoria_id) return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
        if (typeof preco !== 'number' || preco <= 0) return res.status(400).json({ erro: 'Preço inválido' });
        
        const updateStmt = db.prepare(`
            UPDATE produtos 
            SET nome = ?, preco = ?, categoria_id = ?, estoque = ?
            WHERE id = ?
        `);
        updateStmt.run(nome, preco, categoria_id, estoque || 0, id);
        
        const produtoAtualizado = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
        res.json(produtoAtualizado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao atualizar' });
    }
});

// GET /api/categorias - Listar todas
app.get('/api/categorias', (req, res) => {
    const categorias = db.prepare('SELECT * FROM categorias').all();
    res.json(categorias);
});

// GET /api/categorias/:id - Buscar por ID (com produtos!)
app.get('/api/categorias/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    // Buscar categoria
    const categoria = db.prepare(
        'SELECT * FROM categorias WHERE id = ?'
    ).get(id);
    
    if (!categoria) {
        return res.status(404).json({ erro: 'Categoria não encontrada' });
    }
    
    // Buscar produtos desta categoria
    const produtos = db.prepare(
        'SELECT * FROM produtos WHERE categoria_id = ?'
    ).all(id);
    
    // Retornar categoria + produtos
    res.json({
        ...categoria,
        produtos: produtos
    });
});

// POST /api/categorias - Criar categoria
app.post('/api/categorias', (req, res) => {
    const { nome, descricao } = req.body;
    
    if (!nome) {
        return res.status(400).json({ erro: 'Nome obrigatório' });
    }
    
    const result = db.prepare(
        'INSERT INTO categorias (nome, descricao) VALUES (?, ?)'
    ).run(nome, descricao);
    
    const categoria = db.prepare(
        'SELECT * FROM categorias WHERE id = ?'
    ).get(result.lastInsertRowid);
    
    res.status(201).json(categoria);
});

// DELETE /api/categorias/:id - Com validação!
app.delete('/api/categorias/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    // Verificar se tem produtos
    const temProdutos = db.prepare(
        'SELECT COUNT(*) as total FROM produtos WHERE categoria_id = ?'
    ).get(id);
    
    if (temProdutos.total > 0) {
        return res.status(400).json({ 
            erro: `Não pode deletar. Categoria tem ${temProdutos.total} produtos`
        });
    }
    
    db.prepare('DELETE FROM categorias WHERE id = ?').run(id);
    res.status(204).send();
});

app.get('/', (req, res) => res.json({ mensagem: '🎉 API funcionando com sucesso!' }));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});