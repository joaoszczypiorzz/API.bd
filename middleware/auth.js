const jwt = require('jsonwebtoken');
require('dotenv').config(); // 1. Carrega as variáveis de ambiente

// 2. Puxa a chave secreta do .env
const JWT_SECRET = process.env.JWT_SECRET;

// 3. Trava de segurança (opcional, mas recomendado)
if (!JWT_SECRET) {
    console.error('🚨 ERRO FATAL no Auth: JWT_SECRET não está definido!');
    process.exit(1);
}

function autenticar(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
    }
    
    // Formato esperado: "Bearer eyJhbGci..."
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2) {
        return res.status(401).json({ erro: 'Token mal formatado' });
    }
    
    const [scheme, token] = parts;
    
    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ erro: 'Token mal formatado' });
    }
    
    // Agora o JWT_SECRET existe e tem o valor correto do .env!
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ erro: 'Token inválido ou expirado' });
        }
        
        // Adiciona os dados do usuário na requisição para as próximas rotas usarem
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.userRole = decoded.role;
        
        next(); // Vai para a rota original
    });
}

module.exports = autenticar;