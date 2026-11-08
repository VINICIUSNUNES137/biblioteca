'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { get, post } from '@/lib/api'
import { usarUsuario } from '@/lib/usuario'
import { formatarData, formatarDinheiro, paraInputData } from '@/lib/formatar'
import Aviso from '@/components/Aviso'
import Botao from '@/components/Botao'
import CabecalhoPagina from '@/components/CabecalhoPagina'
import CapaLivro from '@/components/CapaLivro'
import EmptyState, { ArteEmprestimo } from '@/components/EmptyState'
import Lozenge from '@/components/Lozenge'
import ModalDevolucao from '@/components/ModalDevolucao'
import Tabela from '@/components/Tabela'

export default function PaginaEmprestimos() {
  const { usuario } = usarUsuario()
  const [lista, setLista] = useState([])
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [somenteAtivos, setSomenteAtivos] = useState(true)
  const [modalDevolucao, setModalDevolucao] = useState(null)
  const [dataDevolucao, setDataDevolucao] = useState(paraInputData(new Date()))

  async function carregar() {
    const query = somenteAtivos ? '?ativos=true' : ''
    setLista(await get(`/emprestimos${query}`))
  }

  useEffect(() => {
    if (!usuario) return
    carregar().catch((e) => setErro(e.message))
  }, [usuario, somenteAtivos])

  function abrirDevolucao(linha) {
    setErro('')
    setModalDevolucao({
      id: linha.id,
      codigo: linha.exemplar.codigo,
      leitorNome: linha.leitor.nome,
      emprestadoEm: linha.emprestadoEm,
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

  return (
    <>
      <CabecalhoPagina
        titulo="Empréstimos"
        descricao="Registre a devolução. Atraso gera multa de R$ 0,50 por dia."
        acoes={
          <label className="interruptor">
            <input
              type="checkbox"
              checked={somenteAtivos}
              onChange={(e) => setSomenteAtivos(e.target.checked)}
            />
            Somente ativos
          </label>
        }
      />

      {!modalDevolucao && (
        <>
          <Aviso tipo="erro" aoFechar={() => setErro('')}>
            {erro}
          </Aviso>
          <Aviso tipo="sucesso" aoFechar={() => setSucesso('')}>
            {sucesso}
          </Aviso>
        </>
      )}

      <div className="cartao" style={{ padding: 0 }}>
        <Tabela
          colunas={[
            {
              chave: 'livro',
              titulo: 'Livro',
              render: (linha) => (
                <Link href={`/livros/${linha.exemplar.livro.id}`} className="celula-livro">
                  <CapaLivro capa={linha.exemplar.livro.capa} titulo={linha.exemplar.livro.titulo} tamanho="mini" />
                  <span>{linha.exemplar.livro.titulo}</span>
                </Link>
              ),
            },
            { chave: 'codigo', titulo: 'Exemplar', render: (linha) => linha.exemplar.codigo },
            { chave: 'leitor', titulo: 'Leitor', render: (linha) => linha.leitor.nome },
            { chave: 'emprestadoEm', titulo: 'Saída', render: (linha) => formatarData(linha.emprestadoEm) },
            { chave: 'previstoPara', titulo: 'Previsto', render: (linha) => formatarData(linha.previstoPara) },
            {
              chave: 'situacao',
              titulo: 'Situação',
              render: (linha) =>
                linha.devolvidoEm ? (
                  <Lozenge situacao="DEVOLVIDO" />
                ) : linha.atrasado ? (
                  <Lozenge situacao="ATRASADO" />
                ) : (
                  <Lozenge situacao="EMPRESTADO" />
                ),
            },
            {
              chave: 'multa',
              titulo: 'Multa',
              render: (linha) =>
                linha.devolvidoEm
                  ? formatarDinheiro(linha.multa)
                  : linha.atrasado
                    ? formatarDinheiro(linha.multaPrevista)
                    : '—',
            },
            {
              chave: 'acoes',
              titulo: '',
              render: (linha) =>
                !linha.devolvidoEm ? (
                  <Botao onClick={() => abrirDevolucao(linha)}>Devolver</Botao>
                ) : null,
            },
          ]}
          linhas={lista}
          vazio={
            <EmptyState
              ilustracao={<ArteEmprestimo />}
              titulo={somenteAtivos ? 'Nenhum empréstimo ativo' : 'Nenhum empréstimo ainda'}
              descricao="Quando um exemplar sair, ele aparece nesta lista com o prazo de 14 dias."
            />
          }
        />
      </div>

      <ModalDevolucao
        aberto={Boolean(modalDevolucao)}
        emprestimo={modalDevolucao}
        data={dataDevolucao}
        setData={setDataDevolucao}
        erro={erro}
        aoFechar={() => setModalDevolucao(null)}
        aoConfirmar={devolver}
      />
    </>
  )
}
