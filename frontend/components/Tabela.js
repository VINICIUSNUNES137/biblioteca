export default function Tabela({ colunas, linhas, vazio, chave = 'id' }) {
  if (!linhas?.length) {
    if (vazio && typeof vazio !== 'string') return vazio
    return <div className="tabela-vazia">{vazio || 'Nenhum registro ainda.'}</div>
  }

  return (
    <div className="tabela-envolve">
      <table className="tabela">
        <thead>
          <tr>
            {colunas.map((coluna) => (
              <th key={coluna.chave}>{coluna.titulo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, indice) => (
            <tr key={linha[chave] ?? indice}>
              {colunas.map((coluna) => (
                <td key={coluna.chave}>{coluna.render ? coluna.render(linha) : linha[coluna.chave]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
