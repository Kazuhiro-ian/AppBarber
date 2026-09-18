import { iniciais } from '../../utils/formato'

/** Foto de perfil; sem URL, mostra as iniciais do nome. */
export function Avatar({ nome, foto, grande = false }) {
  const classe = `avatar ${grande ? 'avatar--grande' : ''}`
  if (foto) {
    return <img className={classe} src={foto} alt={nome ? `Foto de ${nome}` : 'Foto de perfil'} />
  }
  return (
    <span className={classe} aria-hidden="true">
      {iniciais(nome)}
    </span>
  )
}
