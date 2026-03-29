# Projeto API usando Banco de Dados
Projeto desenvolvido para estudo do uso de API's com banco de Dados.

## 🚀 Como rodar o Projeto:

1. Clone o Repositório
2. Instale as dependências: `npm install express`
3. Inicie o servidor: `npm run dev` (Para rodar em modo desenv) ou `npm start` (Para rodar em Produção)
4. O servidor estará rodando em: http://localhost:3000

---

## 📡 Endpoints e Testes No Postman

Abaixo estão detalhados os endpoints da API, implementados até o momento, junto com capturas de tela dos testes realizados:

## 1. Rota de teste (GET)
* **URL:** `/api/produtos`
* **Descrição:** Exibe todos os produtos cadastrados no Banco de Dados.
* **Print teste no Postman:**

![Print GET da API](/Prints/getApiFuncionando.png)


### 2. Criar novo Produto no Banco de Dados (POST)
* **URL:** `/api/produtos`
* **Body (JSON):**  { "nome": "Processador Ryzen 7",
                      "preco": 1700,
                      "categoria": "Peça de Computador",
                      "estoque": 3 
                      }
* **Descrição:** Cria um novo produto dentro do Banco de Dados com ID gerado automaticamente.
* **Teste no Postman:**

![Print do Post dentro do banco de dados](/Prints/PostFuncionando.png)


## 3. Buscar Produto pelo ID (GET)
* **URL:** `/api/produtos/1`
* **Descrição:** Retorna os dados de um produto específico baseado no ID da URL.
* **Teste no Postman:**

![Print da busca de um produto por ID](/Prints/GetPorUsuario.png)

