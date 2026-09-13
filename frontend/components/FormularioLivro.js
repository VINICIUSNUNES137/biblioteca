'use client'

import Campo from './Campo'
import UploadCapa from './UploadCapa'
import { CATEGORIAS } from '@/lib/livro'

export default function FormularioLivro({ formulario, setFormulario, arquivoCapa, setArquivoCapa, capaAtual }) {
  function atualizar(campo, valor) {
    setFormulario({ ...formulario, [campo]: valor })
  }

  return (
    <div className="form-livro">
      <UploadCapa
        arquivo={arquivoCapa}
        capaAtual={capaAtual}
        aoEscolher={setArquivoCapa}
        aoLimpar={() => setArquivoCapa(null)}
      />
      <div className="form-livro__campos">
        <Campo
          rotulo="Título"
          value={formulario.titulo}
          onChange={(e) => atualizar('titulo', e.target.value)}
        />
        <div className="grade-campos">
          <Campo
            rotulo="Autor"
            value={formulario.autor}
            onChange={(e) => atualizar('autor', e.target.value)}
          />
          <Campo
            rotulo="Editora"
            value={formulario.editora}
            onChange={(e) => atualizar('editora', e.target.value)}
          />
          <Campo
            rotulo="ISBN"
            value={formulario.isbn}
            ajuda="Código único no acervo"
            onChange={(e) => atualizar('isbn', e.target.value)}
          />
          <Campo
            rotulo="Ano"
            type="number"
            value={formulario.ano}
            onChange={(e) => atualizar('ano', e.target.value)}
          />
          <Campo
            as="select"
            rotulo="Categoria"
            value={formulario.categoria}
            onChange={(e) => atualizar('categoria', e.target.value)}
          >
            {CATEGORIAS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Campo>
          <Campo
            rotulo="Páginas"
            type="number"
            value={formulario.numeroPaginas}
            onChange={(e) => atualizar('numeroPaginas', e.target.value)}
          />
        </div>
        <Campo
          as="textarea"
          rotulo="Sinopse"
          rows={4}
          value={formulario.sinopse}
          onChange={(e) => atualizar('sinopse', e.target.value)}
        />
      </div>
    </div>
  )
}
