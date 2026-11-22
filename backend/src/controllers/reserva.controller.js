const servico = require('../services/reserva.service')

async function criar(req, res) {
  const reserva = await servico.reservar({
    livroId: req.body.livroId,
    leitorId: req.body.leitorId,
  })
  res.status(201).json(reserva)
}

async function listar(req, res) {
  const lista = req.query.leitor
    ? await servico.listarPorLeitor(req.query.leitor)
    : await servico.listarTodas(req.query.situacao)
  res.json(lista)
}

async function listarFila(req, res) {
  const fila = await servico.listarFilaDoLivro(req.params.id)
  res.json(fila)
}

async function cancelar(req, res) {
  await servico.cancelar(req.params.id)
  res.status(204).end()
}

module.exports = { criar, listar, listarFila, cancelar }
