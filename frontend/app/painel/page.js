'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { get } from '@/lib/api'
import { formatarDinheiro } from '@/lib/formatar'
import Aviso from '@/components/Aviso'
import Avatar from '@/components/Avatar'
import Botao from '@/components/Botao'
import CabecalhoPagina from '@/components/CabecalhoPagina'
import CapaLivro from '@/components/CapaLivro'
import styles from './painel.module.css'

const numero = new Intl.NumberFormat('pt-BR')

function Metrica({ rotulo, valor, unidade, href, tom }) {
  const classe = tom ? `${styles.metrica} ${styles[tom]}` : styles.metrica
  const conteudo = (
    <>
      <span className={styles.rotulo}>{rotulo}</span>
      <div className={styles.valor}>
        <strong>{numero.format(valor)}</strong>
        {unidade && <span>{unidade}</span>}
        {href && <span className={styles.setaMetrica} aria-hidden="true">↘</span>}
      </div>
    </>
  )

  return href
    ? <a className={classe} href={href}>{conteudo}</a>
    : <div className={classe}>{conteudo}</div>
}

function SecaoPainel({ id, titulo, descricao, acao, href, children }) {
  return (
    <section className={styles.secao} id={id} aria-labelledby={`titulo-${id}`}>
      <header className={styles.cabecalho}>
        <div>
          <h2 id={`titulo-${id}`}>{titulo}</h2>
          {descricao && <p>{descricao}</p>}
        </div>
        {href && <Link className={styles.atalho} href={href}>{acao} <span aria-hidden="true">→</span></Link>}
      </header>
      {children}
    </section>
  )
}

function LivroNoPainel({ livro }) {
  return (
    <Link className={styles.itemLivro} href={`/livros/${livro.id}`}>
      <CapaLivro capa={livro.capa} titulo={livro.titulo} tamanho="mini" />
      <span className={styles.identidade}>
        <strong>{livro.titulo}</strong>
        <small>{livro.autor}</small>
      </span>
    </Link>
  )
}

export default function PaginaPainel() {
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [consulta, setConsulta] = useState(0)

  useEffect(() => {
    let ativo = true
    get('/painel/resumo')
      .then((resumo) => { if (ativo) setDados(resumo) })
      .catch((e) => { if (ativo) setErro(e.message) })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [consulta])

  function atualizar() {
    setErro('')
    setCarregando(true)
    setConsulta((anterior) => anterior + 1)
  }

  const bloqueados = dados ? [...dados.leitoresBloqueados].sort((a, b) => b.atrasos - a.atrasos) : []
  const maiorTotal = dados?.livrosMaisEmprestados[0]?.total

  return (
    <div className={styles.painel}>
      <CabecalhoPagina
        titulo="Painel do acervo"
        descricao="Acompanhe empréstimos, devoluções em atraso e filas de espera."
        acoes={
          <Botao variante="sutil" onClick={atualizar} disabled={carregando}>
            {carregando ? 'Atualizando…' : 'Atualizar painel'}
          </Botao>
        }
      />

      <div role="status">
        {erro && (
          <Aviso tipo="erro">
            {dados ? 'Não foi possível atualizar. Os dados exibidos são da última consulta.' : `Não foi possível carregar o painel. ${erro}`}
          </Aviso>
        )}
        {!dados && carregando && <p className={styles.estado}>Carregando indicadores do acervo…</p>}
      </div>

      {dados && (
        <>
          <div className={styles.metricas} aria-label="Indicadores do acervo" role="group">
            <Metrica rotulo="Empréstimos ativos" valor={dados.emprestadosAgora} />
            <Metrica rotulo="Em atraso" valor={dados.emAtraso} href="#atrasos" tom={dados.emAtraso > 0 ? 'alerta' : undefined} />
            <Metrica rotulo="Reservas na fila" valor={dados.filaTotal} href="#fila" tom="fila" />
            <Metrica rotulo="Tempo médio de empréstimo" valor={dados.tempoMedioDias} unidade={dados.tempoMedioDias === 1 ? 'dia' : 'dias'} />
          </div>

          <div className={styles.pendencias}>
            <SecaoPainel
              id="atrasos"
              titulo="Leitores com atraso"
              descricao={`Multa de ${formatarDinheiro(dados.valorDiaMulta)} por dia de atraso.`}
              acao="Ver empréstimos"
              href="/emprestimos"
            >
              {bloqueados.length > 0 ? (
                <ul className={styles.lista} role="list">
                  {bloqueados.map(({ id, usuario, atrasos }) => (
                    <li className={styles.linha} key={id}>
                      <div className={styles.leitor}>
                        <span aria-hidden="true"><Avatar nome={usuario.nome} /></span>
                        <strong>{usuario.nome}</strong>
                      </div>
                      <span className={`${styles.contagem} ${styles.contagemAtraso}`}>
                        {numero.format(atrasos)} {atrasos === 1 ? 'atraso' : 'atrasos'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : <p className={styles.estado}>Nenhum leitor com empréstimo em atraso.</p>}
            </SecaoPainel>

            <SecaoPainel id="fila" titulo="Fila de reservas" acao="Gerenciar reservas" href="/reservas">
              {dados.filaReservas.length > 0 ? (
                <ul className={styles.lista} role="list">
                  {dados.filaReservas.map(({ id, livro, aguardando }) => (
                    <li className={styles.linha} key={id}>
                      <LivroNoPainel livro={livro} />
                      <span className={`${styles.contagem} ${styles.contagemFila}`}>{numero.format(aguardando)} na fila</span>
                    </li>
                  ))}
                </ul>
              ) : <p className={styles.estado}>Nenhuma reserva aguardando.</p>}
            </SecaoPainel>
          </div>

          <SecaoPainel id="ranking" titulo="Livros mais emprestados" descricao="Até cinco títulos, por total de empréstimos no histórico.">
            {dados.livrosMaisEmprestados.length > 0 ? (
              <ol className={styles.lista} role="list">
                {dados.livrosMaisEmprestados.map(({ id, livro, total }, indice) => (
                  <li className={styles.linhaRanking} key={id}>
                    <span className={styles.posicao} aria-hidden="true">{indice + 1}</span>
                    <LivroNoPainel livro={livro} />
                    <div className={styles.barra} aria-hidden="true">
                      <span style={{ width: `${(100 * total) / maiorTotal}%` }} />
                    </div>
                    <span className={styles.totalRanking}>{numero.format(total)} {total === 1 ? 'empréstimo' : 'empréstimos'}</span>
                  </li>
                ))}
              </ol>
            ) : <p className={styles.estado}>Ainda não há empréstimos registrados.</p>}
          </SecaoPainel>
        </>
      )}
    </div>
  )
}
