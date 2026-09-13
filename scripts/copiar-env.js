const fs = require('fs')
const path = require('path')

const raiz = path.join(__dirname, '..')

function copiarSeFaltar(origem, destino) {
  const de = path.join(raiz, origem)
  const para = path.join(raiz, destino)
  if (fs.existsSync(para)) return
  fs.copyFileSync(de, para)
  console.log(`Criado ${destino}`)
}

copiarSeFaltar('backend/.env.example', 'backend/.env')
copiarSeFaltar('frontend/.env.example', 'frontend/.env.local')
