const express = require('express'); 
const fs = require('fs'); 
const path = require('path'); 
const cors = require('cors'); 

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÃO DE ARQUIVOS ---
const clientesFiles = path.join(__dirname, 'clientes.json');
const usuariosFiles = path.join(__dirname, 'usuarios.json'); // Caminho para usuários

// --- FUNÇÕES AUXILIARES (CLIENTES) ---
function lerClientes() {
    if (!fs.existsSync(clientesFiles)) return [];
    const dados = fs.readFileSync(clientesFiles, 'utf8');
    try { return JSON.parse(dados) || []; } catch (e) { return []; }
}
function salvarClientes(clientes) {
    fs.writeFileSync(clientesFiles, JSON.stringify(clientes, null, 2), 'utf-8');
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

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
}); 