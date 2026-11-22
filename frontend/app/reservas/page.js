'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { del, get, post } from '@/lib/api'
import { usarUsuario } from '@/lib/usuario'
import { formatarData } from '@/lib/formatar'
import Aviso from '@/components/Aviso'
import Botao from '@/components/Botao'
import CabecalhoPagina from '@/components/CabecalhoPagina'
import CapaLivro from '@/components/CapaLivro'
import EmptyState, { ArteFila } from '@/components/EmptyState'
import Lozenge from '@/components/Lozenge'
import Modal from '@/components/Modal'
import ModalReserva from '@/components/ModalReserva'
import Tabela from '@/components/Tabela'

export default function PaginaReservas() {
  const { usuario, usuarios } = usarUsuario()
  const [lista, setLista] = useState([])
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [mostrarHistorico, setMostrarHistorico] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [entrega, setEntrega] = useState(null)
  const [confirmando, setConfirmando] = useState(false)

  const leitores = (usuarios || []).filter((item) => item.perfil === 'LEITOR')
  const prontas = lista.filter((item) => item.situacao === 'PRONTA_PARA_RETIRADA')
  const naFila = lista.filter((item) => item.situacao === 'AGUARDANDO')
  const historico = mostrarHistorico ? lista.filter((item) => ['ATENDIDA', 'CANCELADA'].includes(item.situacao)) : []

  async function carregar() {
    setLista(await get('/reservas'))
  }

  useEffect(() => {
    if (!usuario) return
    carregar().catch((e) => setErro(e.message))
  }, [usuario])

  async function cancelar(id) {
    setErro('')
    try {
      await del(`/reservas/${id}`)
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  function abrirReserva() {
    setErro('')
    setSucesso('')
    setModalAberto(true)
  }

  function reservaCriada(reserva) {
    setModalAberto(false)
    setSucesso(`${reserva.leitor.nome} entrou na fila de ${reserva.livro.titulo} em ${reserva.posicao}º lugar.`)
    carregar().catch((e) => setErro(e.message))
  }

  function abrirEntrega(reserva) {
    setErro('')
    setSucesso('')
    setEntrega(reserva)
  }

  function fecharEntrega() {
    if (confirmando) return
    setErro('')
    setEntrega(null)
  }

  async function confirmarEntrega() {
    setConfirmando(true)
    setErro('')
    try {
      await post('/emprestimos', {
        exemplarId: entrega.exemplarSeparado.id,
        leitorId: entrega.leitor.id,
        reservaId: entrega.id,
      })
    } catch (e) {
      setErro(e.message)
      return
    } finally {
      setConfirmando(false)
    }

    setSucesso(`${entrega.exemplarSeparado.codigo} entregue a ${entrega.leitor.nome}. Empréstimo registrado.`)
    setEntrega(null)
    carregar().catch((e) => setErro(e.message))
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Reservas"
        descricao="Acompanhe a fila e confirme a entrega dos exemplares separados."
        acoes={
          <>
            <Botao onClick={abrirReserva}>Colocar na fila</Botao>
            <label className="interruptor">
              <input
                type="checkbox"
                checked={mostrarHistorico}
                onChange={(e) => setMostrarHistorico(e.target.checked)}
              />
              Mostrar histórico
            </label>
          </>
        }
      />

      {!modalAberto && !entrega && (
        <>
          <Aviso tipo="erro" aoFechar={() => setErro('')}>
            {erro}
          </Aviso>
          <div role="status">
            <Aviso tipo="sucesso" aoFechar={() => setSucesso('')}>{sucesso}</Aviso>
          </div>
        </>
      )}

      <div className="cartao" style={{ padding: 0 }}>
        <Tabela
          colunas={[
            {
              chave: 'livro',
              titulo: 'Livro',
              render: (linha) => (
                <Link href={`/livros/${linha.livro.id}`} className="celula-livro">
                  <CapaLivro capa={linha.livro.capa} titulo={linha.livro.titulo} tamanho="mini" />
                  <span>{linha.livro.titulo}</span>
                </Link>
              ),
            },
            { chave: 'leitor', titulo: 'Reservado por', render: (linha) => linha.leitor.nome },
            {
              chave: 'posicao',
              titulo: 'Posição',
              render: (linha) => (linha.posicao ? `${linha.posicao}º` : '—'),
            },
            {
              chave: 'situacao',
              titulo: 'Situação',
              render: (linha) => <Lozenge situacao={linha.situacao} />,
            },
            { chave: 'exemplar', titulo: 'Exemplar separado', render: (linha) => linha.exemplarSeparado?.codigo ?? '—' },
            { chave: 'criadoEm', titulo: 'Pedido em', render: (linha) => formatarData(linha.criadoEm) },
            {
              chave: 'acoes',
              titulo: '',
              render: (linha) => {
                if (linha.situacao === 'PRONTA_PARA_RETIRADA' && linha.exemplarSeparado) {
                  return <Botao onClick={() => abrirEntrega(linha)}>Entregar reserva</Botao>
                }
                return linha.situacao === 'AGUARDANDO' ? (
                  <Botao variante="sutil" onClick={() => cancelar(linha.id)}>
                    Cancelar
                  </Botao>
                ) : null
              },
            },
          ]}
          linhas={[...prontas, ...naFila, ...historico]}
          vazio={
            <EmptyState
              ilustracao={<ArteFila />}
              titulo="Nenhuma reserva para exibir"
              descricao="Quando um título não tiver exemplar livre, coloque o leitor na espera aqui ou na página do livro."
              acao={<Botao onClick={abrirReserva}>Colocar na fila</Botao>}
            />
          }
        />
      </div>

      {modalAberto && (
        <ModalReserva leitores={leitores} aoFechar={() => setModalAberto(false)} aoReservar={reservaCriada} />
      )}

      {entrega && (
        <Modal
          aberto
          titulo="Entregar reserva"
          descricao={`${entrega.livro.titulo} · exemplar ${entrega.exemplarSeparado.codigo}`}
          aoFechar={fecharEntrega}
          rodape={
            <>
              <Botao variante="sutil" onClick={fecharEntrega} disabled={confirmando}>Deixar para depois</Botao>
              <Botao onClick={confirmarEntrega} disabled={confirmando}>
                {confirmando ? 'Confirmando…' : 'Confirmar entrega'}
              </Botao>
            </>
          }
        >
          <Aviso tipo="erro">{erro}</Aviso>
          <p>Entregue o exemplar a <strong>{entrega.leitor.nome}</strong>. A confirmação registra o empréstimo e marca a reserva como atendida.</p>
        </Modal>
      )}
    </>
  )
}
