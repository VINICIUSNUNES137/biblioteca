const servico = require('../services/livro.service')
const movimentacao = require('../services/movimentacao.service')

async function listar(req, res) {
  const livros = await servico.listar(req.query.busca)
  res.json(livros)
}

async function buscar(req, res) {
  const livro = await servico.buscarPorId(req.params.id)
  res.json(livro)
}

async function criar(req, res) {
  const livro = await servico.criar(req.body)
  res.status(201).json(livro)
}

async function atualizar(req, res) {
  const livro = await servico.atualizar(req.params.id, req.body)
  res.json(livro)
}

async function excluir(req, res) {
  await servico.excluir(req.params.id)
  res.status(204).end()
}

async function adicionarExemplar(req, res) {
  const exemplar = await servico.adicionarExemplar(req.params.id, req.body.codigo)
  res.status(201).json(exemplar)
}

async function excluirExemplar(req, res) {
  await servico.excluirExemplar(req.params.id)
  res.status(204).end()
}

async function enviarCapa(req, res) {
  const livro = await servico.salvarCapa(req.params.id, req.file)
  res.json(livro)
}

async function historico(req, res) {
  const lista = await movimentacao.listarPorLivro(req.params.id)
  res.json(lista)
}

module.exports = {
  listar,
  buscar,
  criar,
  atualizar,
  enviarCapa,
  excluir,
  adicionarExemplar,
  excluirExemplar,
  historico,
}
