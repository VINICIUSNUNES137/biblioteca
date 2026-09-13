const servico = require('../services/painel.service')

async function resumo(req, res) {
  const dados = await servico.resumo()
  res.json(dados)
}

module.exports = { resumo }
