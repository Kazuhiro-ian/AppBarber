import { useCallback, useEffect, useState } from 'react'

/**
 * Carrega dados de uma chamada assíncrona controlando estado de carregamento
 * e erro, e devolve `recarregar()` para atualizar a tela após uma ação.
 *
 * @param {Function} buscar função que devolve uma Promise
 * @param {Array}    deps   dependências que disparam nova busca
 */
export function useCarregar(buscar, deps = []) {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  // A função de busca vem inline das telas; as deps explícitas é que controlam.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const executar = useCallback(buscar, deps)

  const recarregar = useCallback(() => {
    let ativo = true
    setCarregando(true)
    setErro(null)
    executar()
      .then((resultado) => ativo && setDados(resultado))
      .catch((e) => ativo && setErro(e.mensagem || 'Não foi possível carregar os dados.'))
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
  }, [executar])

  useEffect(() => recarregar(), [recarregar])

  return { dados, carregando, erro, recarregar, setDados }
}
