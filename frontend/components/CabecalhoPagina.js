export default function CabecalhoPagina({ titulo, descricao, acoes, migalha }) {
  return (
    <div className="cabecalho-pagina">
      <div>
        {migalha && <p className="migalha">{migalha}</p>}
        <h1>{titulo}</h1>
        {descricao && <p>{descricao}</p>}
      </div>
      {acoes && <div className="acoes">{acoes}</div>}
    </div>
  )
}
