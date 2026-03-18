const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());

// --- CONFIGURAÇÃO DE CAMINHOS ---
const BANCO_DADOS = {
    clientes: path.join(__dirname, 'clientes.json'),
    produtos: path.join(__dirname, 'produtos.json')
};

// --- FUNÇÕES AUXILIARES UNIVERSAIS ---

// Lê qualquer arquivo JSON baseado na chave (clientes ou produtos)
function lerDados(tipo) {
    try {
        const arquivo = BANCO_DADOS[tipo];
        if (!fs.existsSync(arquivo)) return [];
        const dados = fs.readFileSync(arquivo, 'utf8');
        return JSON.parse(dados || '[]');
    } catch (e) {
        console.error(`Erro ao ler ${tipo}:`, e);
        return [];
    }
}

// Salva qualquer array no arquivo correspondente
function salvarDados(tipo, objeto) {
    try {
        const arquivo = BANCO_DADOS[tipo];
        fs.writeFileSync(arquivo, JSON.stringify(objeto, null, 2), 'utf-8');
        return true;
    } catch (e) {
        console.error(`Erro ao salvar ${tipo}:`, e);
        return false;
    }
}

// --- ROTAS DE CLIENTES ---

app.get('/clientes', (req, res) => {
    res.json(lerDados('clientes'));
});

app.post('/clientes', (req, res) => {
    const { cpf, nome, idade, endereco, bairro, contato } = req.body;

    if (!cpf || !nome || !idade) {
        return res.status(400).json({ error: 'Dados essenciais faltando (CPF, Nome, Idade)' });
    }

    const clientes = lerDados('clientes');
    if (clientes.some(c => String(c.cpf) === String(cpf))) {
        return res.status(400).json({ error: 'Este CPF já está cadastrado.' });
    }

    const novoCliente = { 
        cpf: String(cpf), 
        nome, 
        idade: Number(idade), 
        endereco, 
        bairro, 
        contato 
    };

    clientes.push(novoCliente);
    if (salvarDados('clientes', clientes)) {
        res.status(201).json({ mensagem: 'Cliente cadastrado!', cliente: novoCliente });
    } else {
        res.status(500).json({ error: 'Erro ao salvar cliente.' });
    }
});

// --- ROTAS DE PRODUTOS ---

app.get('/produtos', (req, res) => {
    res.json(lerDados('produtos'));
});

app.post('/produtos', (req, res) => {
    const { id, nome, preco, estoque } = req.body;

    if (!id || !nome || !preco) {
        return res.status(400).json({ error: 'Dados essenciais faltando (ID, Nome, Preço)' });
    }

    const produtos = lerDados('produtos');
    if (produtos.some(p => String(p.id) === String(id))) {
        return res.status(400).json({ error: 'Este ID de produto já existe.' });
    }

    const novoProduto = { 
        id: String(id), 
        nome, 
        preco: Number(preco), 
        estoque: Number(estoque) || 0 
    };

    produtos.push(novoProduto);
    if (salvarDados('produtos', produtos)) {
        res.status(201).json({ mensagem: 'Produto cadastrado!', produto: novoProduto });
    } else {
        res.status(500).json({ error: 'Erro ao salvar produto.' });
    }
});

// Busca produto individual por ID
app.get('/produtos/:id', (req, res) => {
    const produtos = lerDados('produtos');
    const produto = produtos.find(p => String(p.id) === String(req.params.id));
    
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(produto);
});

// --- INICIALIZAÇÃO ---

app.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
    console.log(`📂 Arquivos: ${BANCO_DADOS.clientes} e ${BANCO_DADOS.produtos}`);
});