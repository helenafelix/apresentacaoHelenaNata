const express = require('express');
const exphbs = require('express-handlebars');
const sequelize = require('./config/bd');
const Filme = require('./models/filme.model');
const Diretor = require('./models/diretor.model');
const Artista = require('./models/artista.model');
const FichaTecnica = require('./models/fichaTecnica.model');
require('./models/relacionamentosModels');
const methodOverride = require('method-override');
const path = require('path');

const app = express();

app.use(methodOverride('_method'));
app.use(express.static('public'));
app.use('/bulma', express.static(path.join(__dirname, 'node_modules/bulma/css')));

// Middleware para formulário
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configurando Handlebars
app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));

app.set('view engine', 'handlebars');

// Rota GET - Página inicial
app.get('/', (req, res) => {

  res.render('home', {
    titulo: 'Página Inicial'
  });

});

// ===================== FILMES =====================

// Rota GET - Listar filmes
app.get('/filmes', async (req, res) => {
  const filmes = await Filme.findAll({raw: true});
  res.render('filmes', { filmes });
});

// Rota GET - Formulário de cadastro (1:N diretor e N:N artistas)
app.get('/filmes/cadastrar', async (req, res) => {
  const diretores = await Diretor.findAll({ raw: true });
  const artistas = await Artista.findAll({ raw: true });
  res.render('cadastrarFilme', { diretores, artistas });
});

// Rota POST - Cadastrar filme
app.post('/filmes', async (req, res) => {
  const nome = req.body.nome;
  const ano = req.body.ano;
  const diretorId = req.body.diretorId;
  const artistas = req.body.artistas || []; // array com os ids selecionados

  const filme = await Filme.create({
    nome: nome,
    ano: ano,
    diretorId: diretorId
  });

  await filme.setArtistas(artistas);

  res.redirect('/filmes');
});

app.get(
  '/filmes/:id/editar',
  async (req, res) => {
    const id = req.params.id;
    const filme = await Filme.findByPk(id, {raw: true});
    res.render('editarFilme', { filme });
  }
);

// Rota GET - Detalhar filme (traz diretor, artistas e ficha técnica)
app.get('/filmes/:id', async (req, res) => {
  const id = req.params.id;

  const filme = await Filme.findByPk(id, {
    include: [
      { model: Diretor, as: 'diretor' },
      { model: Artista, as: 'artistas' },
      { model: FichaTecnica, as: 'fichaTecnica' }
    ]
  });

  res.render('detalharFilme', { filme: filme.toJSON() });
});

app.put(
  '/filmes/:id',
  async (req, res) => {
    const id = req.params.id;
    const nome = req.body.nome;
    const ano = req.body.ano;
  
    const filme = await Filme.findByPk(id);
  
    filme.nome = nome;
    filme.ano = ano;
    await filme.save();

    res.redirect('/filmes');
  }
);

app.delete(
  '/filmes/:id',
  async (req, res) => {
    const id = req.params.id;
    const filme = await Filme.findByPk(id);
    await filme.destroy();
    res.redirect('/filmes');
  }
);

// ===================== FICHA TÉCNICA (1:1) =====================

app.get('/filmes/:id/ficha-tecnica/cadastrar', async (req, res) => {
  const id = req.params.id;

  const filme = await Filme.findByPk(id, { raw: true });

  res.render('cadastrarFichaTecnica', { filme });
});

app.post('/filmes/:id/ficha-tecnica', async (req, res) => {
  const id = req.params.id;
  const duracaoMinutos = req.body.duracaoMinutos;
  const orcamento = req.body.orcamento;
  const bilheteria = req.body.bilheteria;

  const filme = await Filme.findByPk(id);

  await filme.createFichaTecnica({
    duracaoMinutos: duracaoMinutos,
    orcamento: orcamento,
    bilheteria: bilheteria
  });

  res.redirect(`/filmes/${id}`);
});

// ===================== DIRETORES (1:N) =====================

app.get('/diretores', async (req, res) => {
  const diretores = await Diretor.findAll({ raw: true });
  res.render('diretores', { diretores });
});

app.get('/diretores/cadastrar', (req, res) => {
  res.render('cadastrarDiretor');
});

app.post('/diretores', async (req, res) => {
  const nome = req.body.nome;
  const anoNascimento = req.body.anoNascimento;
  const nacionalidade = req.body.nacionalidade;

  await Diretor.create({
    nome: nome,
    anoNascimento: anoNascimento,
    nacionalidade: nacionalidade
  });

  res.redirect('/diretores');
});

app.get('/diretores/:id/editar', async (req, res) => {
  const id = req.params.id;
  const diretor = await Diretor.findByPk(id, { raw: true });

  if (!diretor) {
    return res.redirect('/diretores');
  }

  res.render('editarDiretor', { diretor });
});

app.get('/diretores/:id', async (req, res) => {
  const id = req.params.id;

  const diretor = await Diretor.findByPk(id, {
    include: [{ model: Filme, as: 'filmes' }]
  });

  res.render('detalharDiretor', { diretor: diretor.toJSON() });
});

app.put('/diretores/:id', async (req, res) => {
  const id = req.params.id;
  const nome = req.body.nome;
  const anoNascimento = req.body.anoNascimento;
  const nacionalidade = req.body.nacionalidade;

  const diretor = await Diretor.findByPk(id);

  if (!diretor) {
    return res.redirect('/diretores');
  }

  diretor.nome = nome;
  diretor.anoNascimento = anoNascimento;
  diretor.nacionalidade = nacionalidade;
  await diretor.save();

  res.redirect('/diretores');
});

app.delete('/diretores/:id', async (req, res) => {
  const id = req.params.id;
  const diretor = await Diretor.findByPk(id);

  if (diretor) {
    await diretor.destroy();
  }

  res.redirect('/diretores');
});

// ===================== ARTISTAS (N:N) =====================

app.get('/artistas', async (req, res) => {
  const artistas = await Artista.findAll({ raw: true });
  res.render('artistas', { artistas });
});

app.get('/artistas/cadastrar', (req, res) => {
  res.render('cadastrarArtista');
});

app.post('/artistas', async (req, res) => {
  const nome = req.body.nome;
  const anoNascimento = req.body.anoNascimento;
  const nomeArtistico = req.body.nomeArtistico;

  await Artista.create({
    nome: nome,
    anoNascimento: anoNascimento,
    nomeArtistico: nomeArtistico
  });

  res.redirect('/artistas');
});

app.get('/artistas/:id/editar', async (req, res) => {
  const id = req.params.id;
  const artista = await Artista.findByPk(id, { raw: true });

  if (!artista) {
    return res.redirect('/artistas');
  }

  res.render('editarArtista', { artista });
});

app.get('/artistas/:id', async (req, res) => {
  const id = req.params.id;

  const artista = await Artista.findByPk(id, {
    include: [{ model: Filme, as: 'filmes' }]
  });

  res.render('detalharArtista', { artista: artista.toJSON() });
});

app.put('/artistas/:id', async (req, res) => {
  const id = req.params.id;
  const nome = req.body.nome;
  const anoNascimento = req.body.anoNascimento;
  const nomeArtistico = req.body.nomeArtistico;

  const artista = await Artista.findByPk(id);

  if (!artista) {
    return res.redirect('/artistas');
  }

  artista.nome = nome;
  artista.anoNascimento = anoNascimento;
  artista.nomeArtistico = nomeArtistico;
  await artista.save();

  res.redirect('/artistas');
});

app.delete('/artistas/:id', async (req, res) => {
  const id = req.params.id;
  const artista = await Artista.findByPk(id);

  if (artista) {
    await artista.destroy();
  }

  res.redirect('/artistas');
});

async function conectarBD() {
  try {
    await sequelize.sync();
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
  } catch (erro) {
    console.error('Erro ao conectar:', erro);
  }
}

conectarBD();

// Inicializando servidor
app.listen(3000, () => {
  console.log('Servidor executando em http://localhost:3000');
});