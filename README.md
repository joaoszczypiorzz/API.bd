# Projeto API usando Banco de Dados
Projeto desenvolvido para estudo do uso de API's com banco de Dados.

## 🚀 Como Fazer requisições na API:
O deploy da API foi feito no Render, então para testa-la abra o software de teste de sua preferência ( Postman/Insomnia ) e a API estará rodando na **URL:**  https://minha-api-rest-t03u.onrender.com/
---

## 📡 Endpoints e Testes No Postman

Abaixo estão detalhados os endpoints da API, implementados até o momento, junto com capturas de tela dos testes realizados:

> **⚠️ IMPORTANTE (Rotas Privadas):** As rotas que começam com `/api/` exigem autenticação. Teste primeiro a rota de Login, copie o `token` retornado, vá na aba **Authorization** do Postman, selecione **Bearer Token** e cole o token lá.

### 1. Criar novo Usuário (POST) - Rota Pública
* **URL:** `/auth/register`
* **Body (JSON):** { 
    "nome": "Seu Nome",
    "email": "email@teste.com",
    "senha": "senha_segura_123"
  }
* **Descrição:** Cria um usuário no Banco de Dados e retorna o Token JWT.
* **Print teste no Postman:**

![Print do Registro de Usuário](/Prints/PostRegisterFuncionando.png)


### 2. Fazer Login (POST) - Rota Pública
* **URL:** `/auth/login`
* **Body (JSON):** { 
    "email": "email@teste.com",
    "senha": "senha_segura_123"
  }
* **Descrição:** Autentica o usuário no sistema e devolve o Token JWT para uso nas rotas privadas.
* **Print teste no Postman:**

![Print do Login de Usuário](/Prints/PostLoginFuncionando.png)


## 3. Rota de teste / Listar Produtos (GET)
* **URL:** `/api/produtos`
* **Descrição:** Exibe todos os produtos cadastrados no Banco de Dados.
* **Print teste no Postman:**

![Print GET da API](/Prints/getApiProdutosFuncionando.png)

## 3. Rota de teste / Listar Produtos Com Paginação (GET)
* **URL:** `/api/produtos?pagina=2&limite=5`
* **Descrição:** Exibe todos os produtos cadastrados no Banco de Dados, mas usando as funções de Paginação.
* **Print teste no Postman:**

![Print GET da API](/Prints/getApiPaginacaoFuncionando.png)

## 3. Rota de teste / Listar Produtos Por ordem crescente/Decrescente (GET)
* **URL:** `/api/produtos?ordem=preco&direcao=asc`
* **Descrição:** Exibe todos os produtos cadastrados no Banco de Dados, mas exibindo a ordem de acordo com o gosto do usuário.
* **Print teste no Postman:**

![Print GET da API](/Prints/getApiCrescenteFuncionando.png)


### 4. Criar novo Produto no Banco de Dados (POST)
* **URL:** `/api/produtos`
* **Body (JSON):** { 
    "nome": "Processador Ryzen 7",
    "preco": 1700,
    "categoria_id": 1,
    "estoque": 3 
  }
* **Descrição:** Cria um novo produto dentro do Banco de Dados com ID gerado automaticamente.
* **Teste no Postman:**

![Print do Post dentro do banco de dados](/Prints/PostApiFuncionando.png)


## 5. Buscar Produto pelo ID (GET)
* **URL:** `/api/produtos/1`
* **Descrição:** Retorna os dados de um produto específico baseado no ID da URL.
* **Teste no Postman:**

![Print da busca de um produto por ID](/Prints/GetPorIdfuncionando.png)


### 6. Atualizar Produto (PUT)
* **URL:** `/api/produtos/1`
* **Body (JSON):** { 
    "nome": "Processador Ryzen 7 Atualizado",
    "preco": 1650,
    "categoria_id": 1,
    "estoque": 5 
  }
* **Descrição:** Altera os dados de um produto já existente através do seu ID.
* **Teste no Postman:**

![Print do Put de Produto](/Prints/putProdutoFuncionando.png)


### 7. Deletar Produto (DELETE)
* **URL:** `/api/produtos/1`
* **Descrição:** Remove permanentemente um produto do Banco de Dados pelo ID.
* **Teste no Postman:**

![Print do Delete de Produto](/Prints/DeleteFuncionando.png)


### 8. Listar Categorias (GET)
* **URL:** `/api/categorias`
* **Descrição:** Retorna todas as categorias de produtos cadastradas no banco.
* **Teste no Postman:**

![Print GET de Categorias](/Prints/GetCategoriasFuncionando.png)


### 9. Criar nova Categoria (POST)
* **URL:** `/api/categorias`
* **Body (JSON):** { 
    "nome": "Periféricos",
    "descricao": "Teclados, mouses e fones de ouvido"
  }
* **Descrição:** Registra uma nova categoria no Banco de Dados.
* **Teste no Postman:**

![Print do Post de Categoria](/Prints/PostApiCategoriaFuncionando.png)


### 10. Deletar Categoria (DELETE)
* **URL:** `/api/categorias/1`
* **Descrição:** Exclui uma categoria do Banco de Dados (só permite a exclusão se não houver produtos nela).
* **Teste no Postman:**

![Print do Delete de Categoria](/Prints/DeleteCategoriaFuncionando.png)
