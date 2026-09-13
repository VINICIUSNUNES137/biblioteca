'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { del, enviarArquivo, get, post, put } from '@/lib/api'
import { usarUsuario } from '@/lib/usuario'
import { formatarData, formatarDinheiro, paraInputData } from '@/lib/formatar'
import { FORMULARIO_LIVRO_VAZIO, livroParaFormulario } from '@/lib/livro'
import Aviso from '@/components/Aviso'
import Botao from '@/components/Botao'
import Campo from '@/components/Campo'
import CapaLivro from '@/components/CapaLivro'
import EmptyState, { ArteLivros } from '@/components/EmptyState'
import FormularioLivro from '@/components/FormularioLivro'
import Lozenge from '@/components/Lozenge'
import Modal from '@/components/Modal'
import ModalDevolucao from '@/components/ModalDevolucao'
import Tabela from '@/components/Tabela'

export default function PaginaLivro() {
  const { id } = useParams()
  const router = useRouter()
  const { usuario, usuarios } = usarUsuario()
  const [livro, setLivro] = useState(null)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [codigo, setCodigo] = useState('')
  const [modalEmprestimo, setModalEmprestimo] = useState(null)
  const [modalDevolucao, setModalDevolucao] = useState(null)
  const [dataDevolucao, setDataDevolucao] = useState(paraInputData(new Date()))
  const [historico, setHistorico] = useState([])
  const [leitorId, setLeitorId] = useState('')
  const [confirmacaoExcluir, setConfirmacaoExcluir] = useState(false)
  const [editando, setEditando] = useState(false)
  const [formulario, setFormulario] = useState(FORMULARIO_LIVRO_VAZIO)
  const [arquivoCapa, setArquivoCapa] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const leitores = (usuarios || []).filter((item) => item.perfil === 'LEITOR')

  async function carregar() {
    const [dados, logs] = await Promise.all([get(`/livros/${id}`), get(`/livros/${id}/historico`)])
    setLivro(dados)
    setHistorico(logs)
  }

  useEffect(() => {
    if (!usuario || !id) return
    carregar().catch((e) => setErro(e.message))
  }, [usuario, id])

  async function adicionarExemplar() {
    setErro('')
    try {
      await post(`/livros/${id}/exemplares`, { codigo })
      setCodigo('')
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

  async function emprestar() {
    setErro('')
    try {
      await post('/emprestimos', { exemplarId: modalEmprestimo.id, leitorId: Number(leitorId) })
      setModalEmprestimo(null)
      setLeitorId('')
      setSucesso('Empréstimo registrado. O prazo de 14 dias é calculado automaticamente.')
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  function abrirDevolucao(linha) {
    setErro('')
    setModalDevolucao({
      id: linha.emprestimoAtivo.id,
      codigo: linha.codigo,
      leitorNome: linha.emprestimoAtivo.leitor.nome,
      emprestadoEm: linha.emprestimoAtivo.emprestadoEm,
    })
    setDataDevolucao(paraInputData(new Date()))
  }

  async function devolver() {
    setErro('')
    try {
      const resultado = await post(`/emprestimos/${modalDevolucao.id}/devolver`, {
        devolvidoEm: dataDevolucao,
      })
      const partes = ['Devolução registrada.']
      if (resultado.diasAtraso > 0) {
        partes.push(`Atraso de ${resultado.diasAtraso} dia(s). Multa: ${formatarDinheiro(resultado.multa)}.`)
      }
      partes.push('Exemplar voltou para o acervo.')
      setModalDevolucao(null)
      setSucesso(partes.join(' '))
      await carregar()
    } catch (e) {
      setErro(e.message)
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

      {!(modalDevolucao || modalEmprestimo || editando) && (
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
            rotulo="Código (tombo)"
            placeholder="EX-0010"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
          <Botao onClick={adicionarExemplar} disabled={!codigo}>
            Adicionar exemplar
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
              chave: 'com',
              titulo: 'Com quem',
              render: (linha) =>
                linha.emprestimoAtivo
                  ? `${linha.emprestimoAtivo.leitor.nome} · até ${formatarData(linha.emprestimoAtivo.previstoPara)}`
                  : '—',
            },
            {
              chave: 'acoes',
              titulo: '',
              render: (linha) => (
                <div className="acoes">
                  {linha.situacao === 'DISPONIVEL' && (
                    <Botao onClick={() => setModalEmprestimo(linha)}>Emprestar</Botao>
                  )}
                  {linha.situacao === 'EMPRESTADO' && linha.emprestimoAtivo && (
                    <Botao onClick={() => abrirDevolucao(linha)}>Devolver</Botao>
                  )}
                  <Botao variante="sutil" onClick={() => excluirExemplar(linha.id)}>
                    Excluir
                  </Botao>
                </div>
              ),
            },
          ]}
          linhas={livro.exemplares}
          vazio={
            <EmptyState
              ilustracao={<ArteLivros />}
              titulo="Nenhum exemplar neste título"
              descricao="Cada cópia física tem um tombo. Cadastre a primeira para poder emprestar."
            />
          }
        />
      </div>

      <div className="cartao">
        <h2>Histórico de transações</h2>
        <Tabela
          colunas={[
            { chave: 'data', titulo: 'Data', render: (linha) => formatarData(linha.data) },
            {
              chave: 'tipo',
              titulo: 'Movimento',
              render: (linha) => <Lozenge situacao={linha.tipo} />,
            },
            {
              chave: 'exemplar',
              titulo: 'Exemplar',
              render: (linha) => linha.exemplar?.codigo || '—',
            },
            {
              chave: 'leitor',
              titulo: 'Leitor',
              render: (linha) => linha.leitor?.nome || '—',
            },
            { chave: 'detalhe', titulo: 'Detalhe' },
            {
              chave: 'multa',
              titulo: 'Multa',
              render: (linha) => (linha.multa ? formatarDinheiro(linha.multa) : '—'),
            },
          ]}
          linhas={historico}
          vazio={
            <EmptyState
              ilustracao={<ArteLivros />}
              titulo="Nenhuma transação neste título"
              descricao="Empréstimos e devoluções aparecem aqui, na ordem em que aconteceram."
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
        aberto={Boolean(modalEmprestimo)}
        titulo="Emprestar exemplar"
        descricao={`Exemplar ${modalEmprestimo?.codigo}. O prazo de 14 dias é calculado pelo sistema.`}
        aoFechar={() => setModalEmprestimo(null)}
        rodape={
          <>
            <Botao variante="sutil" onClick={() => setModalEmprestimo(null)}>
              Cancelar
            </Botao>
            <Botao onClick={emprestar} disabled={!leitorId}>
              Confirmar empréstimo
            </Botao>
          </>
        }
      >
        <Aviso tipo="erro">{erro}</Aviso>
        <Campo as="select" rotulo="Leitor" value={leitorId} onChange={(e) => setLeitorId(e.target.value)}>
          <option value="">Selecione quem leva o livro</option>
          {leitores.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </Campo>
      </Modal>

      <ModalDevolucao
        aberto={Boolean(modalDevolucao)}
        emprestimo={modalDevolucao}
        data={dataDevolucao}
        setData={setDataDevolucao}
        erro={erro}
        aoFechar={() => setModalDevolucao(null)}
        aoConfirmar={devolver}
      />

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
