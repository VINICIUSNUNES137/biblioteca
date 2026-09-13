class ErroDeNegocio extends Error {
  constructor(codigo, mensagem, status = 400) {
    super(mensagem)
    this.codigo = codigo
    this.mensagem = mensagem
    this.status = status
  }
}

module.exports = ErroDeNegocio
