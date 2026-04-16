const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database'); 
const autenticar = require('./middleware/auth');
require('dotenv').config(); 
const cors = require('cors');

const app = express();
app.use(express.json()); 

// 3. Usar variáveis
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('🚨 ERRO FATAL: JWT_SECRET não está definido nas variáveis de ambiente!');
    process.exit(1); // Desliga o servidor imediatamente para você perceber o erro
}

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : '*'; // Aceita requisições de qualquer lugar se a variável não existir

app.use(cors({
  origin: allowedOrigins
}));


// ==========================================
// ROTAS PÚBLICAS (Não precisam de Token)
// ==========================================

app.get('/', (req, res) => res.json({ mensagem: '🎉 API funcionando com sucesso!' }));

// POST /auth/register
app.post('/auth/register', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;
        
        if (!nome || !email || !senha) {
            return res.status(400).json({ erro: 'Campos obrigatórios' });
        }
        
        if (senha.length < 6) {
            return res.status(400).json({ erro: 'Senha mínimo 6 caracteres' });
        }
        
        const usuarioExiste = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
        
        if (usuarioExiste) {
            return res.status(400).json({ erro: 'Email já cadastrado' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        
        const result = db.prepare(`
            INSERT INTO usuarios (nome, email, senha)
            VALUES (?, ?, ?)
        `).run(nome, email, senhaHash);
        
        const userId = result.lastInsertRowid;
        
        const token = jwt.sign(
            { userId, email, role: 'user' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(201).json({
            mensagem: 'Usuário criado com sucesso',
            token,
            usuario: { id: userId, nome, email }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao criar usuário' });
    }
});

// POST /auth/login
app.post('/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha obrigatórios' });
        }
        
        const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
        
        if (!usuario) {
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }
        
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        
        if (!senhaCorreta) {
            return res.status(401).json({ erro: 'Email ou senha incorretos' });
        }
        
        const token = jwt.sign(
            { userId: usuario.id, email: usuario.email, role: usuario.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            mensagem: 'Login realizado com sucesso',
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                role: usuario.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro no login' });
    }
});


// ==========================================
// PROTEÇÃO GLOBAL PARA ROTAS /api
// ==========================================
// A partir desta linha, TODAS as rotas que começam com /api vão exigir o Token JWT
app.use('/api', autenticar);


// ==========================================
// ROTAS PRIVADAS (Exigem Token JWT)
// ==========================================

// GET /api/produtos
app.get('/api/produtos', (req, res) => {
    try {
        const { categoria_id, preco_max, preco_min, ordem, direcao, pagina = 1, limite = 10 } = req.query;
        
        const baseQuery = `
            FROM produtos p
            INNER JOIN categorias c ON p.categoria_id = c.id
            WHERE 1=1
        `;
        
        let filtros = '';
        const paramsFiltros = []; 
        
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
        
        const countSql = `SELECT COUNT(*) as total ` + baseQuery + filtros;
        const countStmt = db.prepare(countSql);
        const { total } = countStmt.get(...paramsFiltros);
        
        let ordemSql = '';
        const camposValidos = ['nome', 'preco', 'categoria_id', 'created_at'];
        
        if (ordem && camposValidos.includes(ordem)) {
            const dir = (direcao && direcao.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
            ordemSql += ` ORDER BY p.${ordem} ${dir}`; 
        } else {
            ordemSql += ` ORDER BY p.nome ASC`;
        }
        
        const limiteNum = parseInt(limite);
        const paginaNum = parseInt(pagina);
        const offset = (paginaNum - 1) * limiteNum;
        
        let paginacaoSql = ' LIMIT ? OFFSET ?';
        const paramsFinais = [...paramsFiltros, limiteNum, offset]; 
        
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

// GET /api/produtos/:id
app.get('/api/produtos/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const produtoEncontrado = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
        
        if (!produtoEncontrado) return res.status(404).json({ erro: 'Produto não encontrado' });
        res.json(produtoEncontrado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar produto' });
    }
});

// POST /api/produtos
app.post('/api/produtos', (req, res) => {
    try {
        const { nome, preco, categoria_id, estoque = 0 } = req.body;
        
        if (!nome || !preco || !categoria_id) return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
        if (typeof preco !== 'number' || preco <= 0) return res.status(400).json({ erro: 'Preço inválido' });
        
        const result = db.prepare(`
            INSERT INTO produtos (nome, preco, categoria_id, estoque)
            VALUES (?, ?, ?, ?)
        `).run(nome, preco, categoria_id, estoque);
        
        const produtoCriado = db.prepare('SELECT * FROM produtos WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(produtoCriado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao criar produto' });
    }
});

// DELETE /api/produtos/:id
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

// PUT /api/produtos/:id
app.put('/api/produtos/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const produtoExiste = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
        
        if (!produtoExiste) return res.status(404).json({ erro: 'Produto não encontrado' });
        
        const { nome, preco, categoria_id, estoque } = req.body;
        
        if (!nome || !preco || !categoria_id) return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
        if (typeof preco !== 'number' || preco <= 0) return res.status(400).json({ erro: 'Preço inválido' });
        
        db.prepare(`
            UPDATE produtos 
            SET nome = ?, preco = ?, categoria_id = ?, estoque = ?
            WHERE id = ?
        `).run(nome, preco, categoria_id, estoque || 0, id);
        
        const produtoAtualizado = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
        res.json(produtoAtualizado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao atualizar' });
    }
});

// GET /api/categorias
app.get('/api/categorias', (req, res) => {
    const categorias = db.prepare('SELECT * FROM categorias').all();
    res.json(categorias);
});

// GET /api/categorias/:id
app.get('/api/categorias/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const categoria = db.prepare('SELECT * FROM categorias WHERE id = ?').get(id);
    
    if (!categoria) return res.status(404).json({ erro: 'Categoria não encontrada' });
    
    const produtos = db.prepare('SELECT * FROM produtos WHERE categoria_id = ?').all(id);
    res.json({ ...categoria, produtos });
});

// POST /api/categorias
app.post('/api/categorias', (req, res) => {
    const { nome, descricao } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome obrigatório' });
    
    const result = db.prepare('INSERT INTO categorias (nome, descricao) VALUES (?, ?)').run(nome, descricao);
    const categoria = db.prepare('SELECT * FROM categorias WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(categoria);
});

// DELETE /api/categorias/:id
app.delete('/api/categorias/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const temProdutos = db.prepare('SELECT COUNT(*) as total FROM produtos WHERE categoria_id = ?').get(id);
    
    if (temProdutos.total > 0) {
        return res.status(400).json({ erro: `Não pode deletar. Categoria tem ${temProdutos.total} produtos` });
    }
    
    db.prepare('DELETE FROM categorias WHERE id = ?').run(id);
    res.status(204).send();
});
