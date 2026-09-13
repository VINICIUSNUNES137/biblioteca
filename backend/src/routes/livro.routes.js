const { Router } = require('express')
const controller = require('../controllers/livro.controller')
const identificarUsuario = require('../middlewares/identificarUsuario')
const exigirPerfil = require('../middlewares/exigirPerfil')
const { receberCapa } = require('../middlewares/uploadCapa')
const assincrono = require('../util/assincrono')

const rotas = Router()

rotas.get('/livros', identificarUsuario, assincrono(controller.listar))
rotas.post('/livros', identificarUsuario, exigirPerfil('BIBLIOTECARIO'), assincrono(controller.criar))
rotas.post('/livros/:id/capa', identificarUsuario, exigirPerfil('BIBLIOTECARIO'), receberCapa, assincrono(controller.enviarCapa))
rotas.post('/livros/:id/exemplares', identificarUsuario, exigirPerfil('BIBLIOTECARIO'), assincrono(controller.adicionarExemplar))
rotas.get('/livros/:id', identificarUsuario, assincrono(controller.buscar))
rotas.put('/livros/:id', identificarUsuario, exigirPerfil('BIBLIOTECARIO'), assincrono(controller.atualizar))
rotas.delete('/livros/:id', identificarUsuario, exigirPerfil('BIBLIOTECARIO'), assincrono(controller.excluir))
rotas.delete('/exemplares/:id', identificarUsuario, exigirPerfil('BIBLIOTECARIO'), assincrono(controller.excluirExemplar))

module.exports = rotas
