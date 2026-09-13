'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { del, enviarArquivo, get, post, put } from '@/lib/api'
import { usarUsuario } from '@/lib/usuario'
import { FORMULARIO_LIVRO_VAZIO, livroParaFormulario } from '@/lib/livro'
import Aviso from '@/components/Aviso'
import Botao from '@/components/Botao'
import Campo from '@/components/Campo'
import CapaLivro from '@/components/CapaLivro'
import EmptyState, { ArteLivros } from '@/components/EmptyState'
import FormularioLivro from '@/components/FormularioLivro'
import Lozenge from '@/components/Lozenge'
import Modal from '@/components/Modal'
import Tabela from '@/components/Tabela'

export default function PaginaLivro() {
  const { id } = useParams()
  const router = useRouter()
  const { usuario } = usarUsuario()
  const [livro, setLivro] = useState(null)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [confirmacaoExcluir, setConfirmacaoExcluir] = useState(false)
  const [editando, setEditando] = useState(false)
  const [formulario, setFormulario] = useState(FORMULARIO_LIVRO_VAZIO)
  const [arquivoCapa, setArquivoCapa] = useState(null)
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setLivro(await get(`/livros/${id}`))
  }

  useEffect(() => {
    if (!usuario || !id) return
    carregar().catch((e) => setErro(e.message))
  }, [usuario, id])

  async function adicionarExemplar() {
    setErro('')
    setSucesso('')
    try {
      const criados = await post(`/livros/${id}/exemplares`, { quantidade: Number(quantidade) })
      const tombos = criados.map((item) => item.codigo)
      setSucesso(
        tombos.length === 1
          ? `Exemplar ${tombos[0]} cadastrado.`
          : `Exemplares ${tombos[0]} a ${tombos[tombos.length - 1]} cadastrados.`
      )
      setQuantidade(1)
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  async function excluirExemplar(exemplarId) {
    setErro('')
    try {
      await del(`/exemplares/${exemplarId}`)
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  async function excluirLivro() {
    setErro('')
    try {
      await del(`/livros/${id}`)
      router.push('/livros')
    } catch (e) {
      setErro(e.message)
      setConfirmacaoExcluir(false)
    }
  }

  function abrirEdicao() {
    setFormulario(livroParaFormulario(livro))
    setArquivoCapa(null)
    setEditando(true)
  }

  async function salvarEdicao() {
    setSalvando(true)
    setErro('')
    try {
      await put(`/livros/${id}`, {
        ...formulario,
        ano: Number(formulario.ano),
        numeroPaginas: formulario.numeroPaginas ? Number(formulario.numeroPaginas) : null,
      })
      if (arquivoCapa) await enviarArquivo(`/livros/${id}/capa`, arquivoCapa)
      setEditando(false)
      await carregar()
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  if (!livro) {
    return erro ? <Aviso tipo="erro">{erro}</Aviso> : <p>Carregando…</p>
  }

  return (
    <>
      <p className="migalha">
        <Link href="/livros">Catálogo</Link> / {livro.titulo}
      </p>

      <div className="detalhe-livro">
        <CapaLivro capa={livro.capa} titulo={livro.titulo} tamanho="grande" />
        <div className="detalhe-livro__info">
          <h1>{livro.titulo}</h1>
          <p className="detalhe-livro__autor">{livro.autor}</p>
          <div className="chips">
            {livro.categoria && <span className="chip">{livro.categoria}</span>}
            <span className="chip">{livro.ano}</span>
            {livro.editora && <span className="chip">{livro.editora}</span>}
            {livro.numeroPaginas && <span className="chip">{livro.numeroPaginas} páginas</span>}
            <span className="chip">ISBN {livro.isbn}</span>
          </div>
          {livro.sinopse && <p className="sinopse">{livro.sinopse}</p>}
          <p className="sinopse" style={{ marginBottom: 20 }}>
            {livro.totalExemplares} exemplares · {livro.disponiveis} disponíveis
          </p>
          <div className="acoes">
            <Botao variante="sutil" onClick={abrirEdicao}>
              Editar
            </Botao>
            <Botao variante="perigo" onClick={() => setConfirmacaoExcluir(true)}>
              Excluir
            </Botao>
          </div>
        </div>
      </div>

      {!editando && (
        <>
          <Aviso tipo="erro" aoFechar={() => setErro('')}>
            {erro}
          </Aviso>
          <Aviso tipo="sucesso" aoFechar={() => setSucesso('')}>
            {sucesso}
          </Aviso>
        </>
      )}

      <div className="cartao">
        <div className="secao-titulo">
          <h2>Exemplares</h2>
        </div>
        <div className="acoes" style={{ marginBottom: 16 }}>
          <Campo
            rotulo="Quantos adicionar"
            type="number"
            min="1"
            max="50"
            ajuda="O tombo (EX-0001, EX-0002…) é gerado pelo sistema."
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
          <Botao onClick={adicionarExemplar} disabled={Number(quantidade) < 1}>
            {Number(quantidade) > 1 ? 'Adicionar exemplares' : 'Adicionar exemplar'}
          </Botao>
        </div>
        <Tabela
          colunas={[
            { chave: 'codigo', titulo: 'Código' },
            {
              chave: 'situacao',
              titulo: 'Situação',
              render: (linha) => <Lozenge situacao={linha.situacao} />,
            },
            {
              chave: 'acoes',
              titulo: '',
              render: (linha) => (
                <Botao variante="sutil" onClick={() => excluirExemplar(linha.id)}>
                  Excluir
                </Botao>
              ),
            },
          ]}
          linhas={livro.exemplares}
          vazio={
            <EmptyState
              ilustracao={<ArteLivros />}
              titulo="Nenhum exemplar neste título"
              descricao="Cada cópia física ganha um tombo automático. Cadastre a primeira para o livro existir no acervo."
            />
          }
        />
      </div>

      <Modal
        aberto={editando}
        tamanho="grande"
        titulo="Editar livro"
        descricao="Atualize os dados do título ou troque a capa."
        aoFechar={() => setEditando(false)}
        rodape={
          <>
            <Botao variante="sutil" onClick={() => setEditando(false)}>
              Cancelar
            </Botao>
            <Botao onClick={salvarEdicao} disabled={salvando}>
              Salvar
            </Botao>
          </>
        }
      >
        <Aviso tipo="erro">{erro}</Aviso>
        <FormularioLivro
          formulario={formulario}
          setFormulario={setFormulario}
          arquivoCapa={arquivoCapa}
          setArquivoCapa={setArquivoCapa}
          capaAtual={livro.capa}
        />
      </Modal>

      <Modal
        aberto={confirmacaoExcluir}
        perigo
        titulo="Excluir este título?"
        descricao="Só é possível excluir se não houver exemplares cadastrados. Essa ação não pode ser desfeita."
        aoFechar={() => setConfirmacaoExcluir(false)}
        rodape={
          <>
            <Botao variante="sutil" onClick={() => setConfirmacaoExcluir(false)}>
              Cancelar
            </Botao>
            <Botao variante="perigo" onClick={excluirLivro}>
              Excluir livro
            </Botao>
          </>
        }
      >
        <p>O catálogo deixa de listar este título.</p>
      </Modal>
    </>
  )
}
