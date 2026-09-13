const servico = require('../services/usuario.service')

async function listar(req, res) {
  const usuarios = await servico.listar()
  res.json(usuarios)
}

async function buscar(req, res) {
  const usuario = await servico.buscarPorId(req.params.id)
  res.json(usuario)
}

async function criar(req, res) {
  const usuario = await servico.criar(req.body)
  res.status(201).json(usuario)
}

async function atualizar(req, res) {
  const usuario = await servico.atualizar(req.params.id, req.body)
  res.json(usuario)
}

async function excluir(req, res) {
  await servico.excluir(req.params.id)
  res.status(204).end()
}

module.exports = { listar, buscar, criar, atualizar, excluir }
