const servico = require('../services/usuario.service')

async function listar(req, res) {
  const usuarios = await servico.listar()
  res.json(usuarios)
}

module.exports = { listar }
