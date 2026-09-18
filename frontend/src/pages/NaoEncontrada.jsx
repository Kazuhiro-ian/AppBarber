import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Vazio } from '../components/ui/Estados'
import { rotaInicial } from '../utils/navegacao'

export default function NaoEncontrada() {
  const { perfil } = useAuth()
  return (
    <Vazio
      icone="🧭"
      titulo="Página não encontrada"
      descricao="O endereço acessado não existe ou foi movido."
      acao={
        <Link className="btn btn--primario" to={rotaInicial(perfil)}>
          Voltar ao início
        </Link>
      }
    />
  )
}
