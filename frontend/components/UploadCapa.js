'use client'

import { useEffect, useState } from 'react'
import { urlCapa } from '@/lib/api'

export default function UploadCapa({ arquivo, capaAtual, aoEscolher, aoLimpar }) {
  const [arrastando, setArrastando] = useState(false)
  const [previewLocal, setPreviewLocal] = useState(null)

  useEffect(() => {
    if (!arquivo) {
      setPreviewLocal(null)
      return
    }
    const url = URL.createObjectURL(arquivo)
    setPreviewLocal(url)
    return () => URL.revokeObjectURL(url)
  }, [arquivo])

  const preview = previewLocal || urlCapa(capaAtual)

  function receberArquivo(lista) {
    const escolhido = lista?.[0]
    if (!escolhido) return
    if (!escolhido.type.startsWith('image/')) return
    aoEscolher(escolhido)
  }

  return (
    <div className="upload-capa">
      <span className="campo__rotulo">Capa</span>
      <label
        className={`upload-capa__area${arrastando ? ' is-arrastando' : ''}${preview ? ' tem-preview' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault()
          setArrastando(false)
          receberArquivo(e.dataTransfer.files)
        }}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          onChange={(e) => receberArquivo(e.target.files)}
        />
        {preview ? (
          <img src={preview} alt="Pré-visualização da capa" />
        ) : (
          <div className="upload-capa__dica">
            <strong>Solte a imagem aqui</strong>
            <span>ou clique para escolher · JPG, PNG, SVG até 2 MB</span>
          </div>
        )}
      </label>
      {(arquivo || capaAtual) && aoLimpar && (
        <button type="button" className="link-acao" onClick={aoLimpar}>
          Remover capa
        </button>
      )}
    </div>
  )
}
