require('dotenv').config()

const path = require('path')
const express = require('express')
const cors = require('cors')
const errorHandler = require('./middlewares/errorHandler')
const usuarioRotas = require('./routes/usuario.routes')
const livroRotas = require('./routes/livro.routes')

const app = express()
const PORTA = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:3000', allowedHeaders: ['Content-Type', 'x-usuario-id'] }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.get('/saude', (req, res) => res.json({ ok: true }))

app.use(usuarioRotas)
app.use(livroRotas)

app.use(errorHandler)

app.listen(PORTA, () => {
  console.log(`API da biblioteca em http://localhost:${PORTA}`)
})
