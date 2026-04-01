const express = require('express'); 
const fs = require('fs'); 
const path = require('path'); 
const cors = require('cors'); 

const app = express();
const port = 3000;
app.use(cors());

// Middleware robusto para JSON parsing
app.use((req, res, next) => {
    // Se tiver content-length mas for 0, limpa o header para evitar erro
    if (req.headers['content-length'] === '0') {
        delete req.headers['content-length'];
    }
    
    // Só faz parse de JSON para métodos que normalmente usam corpo
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        express.json({ 
            strict: false,
            limit: '10mb'
        })(req, res, next);
    } else {
        next();
    }
});

// Middleware para tratar erros de JSON parsing
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Erro de JSON:', {
            method: req.method,
            url: req.url,
            contentType: req.headers['content-type'],
            contentLength: req.headers['content-length']
        });
        return res.status(400).json({ 
            error: 'JSON inválido. Verifique o formato do corpo da requisição.' 
        });
    }
    next(err);
});

// --- CONFIGURAÇÃO DE ARQUIVOS ---
const clientesFiles = path.join(__dirname, 'clientes.json');
const usuariosFiles = path.join(__dirname, 'usuarios.json'); // Caminho para usuários
const produtosFiles = path.join(__dirname, 'produtos.json'); // Caminho para produtos

// --- FUNÇÕES AUXILIARES (CLIENTES) ---
function lerClientes() {
    if (!fs.existsSync(clientesFiles)) return [];
    const dados = fs.readFileSync(clientesFiles, 'utf8');
    try { return JSON.parse(dados) || []; } catch (e) { return []; }
}
function salvarClientes(clientes) {
    fs.writeFileSync(clientesFiles, JSON.stringify(clientes, null, 2), 'utf-8');
}

// --- FUNÇÕES AUXILIARES (PRODUTOS) ---
function lerProdutos() {
    if (!fs.existsSync(produtosFiles)) return [];
    const dados = fs.readFileSync(produtosFiles, 'utf8');
    try { return JSON.parse(dados) || []; } catch (e) { return []; }
}
function salvarProdutos(produtos) {
    fs.writeFileSync(produtosFiles, JSON.stringify(produtos, null, 2), 'utf-8');
}

// --- FUNÇÕES AUXILIARES (USUÁRIOS) ---
function lerUsuarios() {
    if (!fs.existsSync(usuariosFiles)) return [];
    const dados = fs.readFileSync(usuariosFiles, 'utf8');
    try { return JSON.parse(dados) || []; } catch (e) { return []; }
}
function salvarUsuarios(usuarios) {
    fs.writeFileSync(usuariosFiles, JSON.stringify(usuarios, null, 2), 'utf-8');
}

/*
  USUÁRIOS ENDPOINTS
*/

app.post('/usuarios', (req, res) => {
    const { codigo, nome, email, senha } = req.body;

    // Validação de campos
    if (!codigo || !nome || !email || !senha) {
        return res.status(400).json({ error: 'Código, Nome, Email e Senha são obrigatórios' });
    }

    const usuarios = lerUsuarios();

    // Verifica se o código ou email já existem
    if (usuarios.some(u => u.codigo === codigo)) {
        return res.status(400).json({ error: 'Código de usuário já cadastrado' });
    }
    if (usuarios.some(u => u.email === email)) {
        return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const novoUsuario = { codigo, nome, email, senha };

    usuarios.push(novoUsuario);
    salvarUsuarios(usuarios);

    res.status(201).json({ 
        mensagem: 'Usuário cadastrado com sucesso', 
        usuario: { codigo, nome, email } // Retornamos sem a senha por segurança
    });
});

app.get("/usuarios", (req, res) => {
    const usuarios = lerUsuarios();
    // Mapeamos para não enviar a senha no GET geral
    const listaSegura = usuarios.map(({ senha, ...resto }) => resto);
    res.status(200).json(listaSegura);
});

/*
  CLIENTES ENDPOINTS (Mantidos)
*/

app.post('/clientes', (req, res) => {
    const { cpf, nome, idade, endereco, bairro, contato } = req.body;
    if (!cpf || !nome || !idade || !endereco || !bairro || !contato) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const clientes = lerClientes();
    if (clientes.some(c => c.cpf === cpf)) {
        return res.status(400).json({ error: 'CPF já cadastrado' });
    }

    const novoCliente = { cpf, nome, idade, endereco, bairro, contato };
    clientes.push(novoCliente);
    salvarClientes(clientes);
    res.status(201).json({ mensagem: 'Cliente cadastrado com sucesso', cliente: novoCliente });
});

app.get("/clientes", (req, res) => {
    const clientes = lerClientes();
    res.status(200).json(clientes);
});

app.get("/clientes/:cpf", (req, res) => {
    const { cpf } = req.params;
    const clientes = lerClientes();
    const cliente = clientes.find(c => c.cpf === cpf);
    if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.status(200).json(cliente);
});

/*
  PRODUTOS ENDPOINTS (Mantidos)
*/

app.post('/produtos', (req, res) => {
    const { id, nome, preco, estoque } = req.body;
    if (!id || !nome || !preco) {
        return res.status(400).json({ error: 'ID, Nome e Preço são obrigatórios' });
    }

    const produtos = lerProdutos();
    if (produtos.some(p => p.id === id)) {
        return res.status(400).json({ error: 'ID de produto já cadastrado' });
    }

    const novoProduto = { id, nome, preco: Number(preco), estoque: Number(estoque) || 0 };
    produtos.push(novoProduto);
    salvarProdutos(produtos);
    res.status(201).json({ mensagem: 'Produto cadastrado com sucesso', produto: novoProduto });
});

app.get("/produtos", (req, res) => {
    const produtos = lerProdutos();
    res.status(200).json(produtos);
});

app.get("/produtos/:id", (req, res) => {
    const { id } = req.params;
    const produtos = lerProdutos();
    const produto = produtos.find(p => p.id === id);
    if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.status(200).json(produto);
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
}); 