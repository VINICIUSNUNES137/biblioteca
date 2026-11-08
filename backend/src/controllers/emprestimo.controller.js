const servico = require('../services/emprestimo.service')

async function criar(req, res) {
  const emprestimo = await servico.emprestar(req.body)
  res.status(201).json(emprestimo)
}

async function listar(req, res) {
  const lista = await servico.listar({
    ativos: req.query.ativos,
    atrasados: req.query.atrasados,
    leitorId: req.query.leitor,
  })
  res.json(lista)
}

async function devolver(req, res) {
  const resultado = await servico.devolver(req.params.id, req.body || {})
  res.json(resultado)
}

module.exports = { criar, listar, devolver }
