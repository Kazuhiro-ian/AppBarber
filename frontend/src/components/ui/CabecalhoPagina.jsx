export function CabecalhoPagina({ titulo, subtitulo, acao }) {
  return (
    <header className="page-header">
      <div>
        <h1>{titulo}</h1>
        {subtitulo && <p className="page-header__subtitulo">{subtitulo}</p>}
      </div>
      {acao}
    </header>
  )
}
