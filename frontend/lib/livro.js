export const CATEGORIAS = ['Clássico', 'Romance', 'Conto', 'Naturalismo', 'Regionalismo', 'Infantojuvenil', 'Técnico', 'Biografia']

export const FORMULARIO_LIVRO_VAZIO = {
  titulo: '',
  autor: '',
  isbn: '',
  ano: '',
  editora: '',
  categoria: 'Clássico',
  sinopse: '',
  numeroPaginas: '',
}

export function livroParaFormulario(livro) {
  return {
    titulo: livro.titulo || '',
    autor: livro.autor || '',
    isbn: livro.isbn || '',
    ano: livro.ano || '',
    editora: livro.editora || '',
    categoria: livro.categoria || 'Clássico',
    sinopse: livro.sinopse || '',
    numeroPaginas: livro.numeroPaginas || '',
  }
}
