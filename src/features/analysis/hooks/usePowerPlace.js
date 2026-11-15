import { useRef, useState } from 'react'
import { fetchPowerMonthly } from '@/services/nasa/powerService.js'

// Estado de la consulta en vivo de un punto: idle | loading | ready | error.
export function usePowerPlace() {
  const [state, setState] = useState({ status: 'idle' })
  const latest = useRef(0)

  async function load(latitude, longitude) {
    const request = ++latest.current
    setState({ status: 'loading' })
    try {
      const data = await fetchPowerMonthly({ latitude, longitude })
      if (request === latest.current) setState({ status: 'ready', data })
    } catch (error) {
      if (request === latest.current) setState({ status: 'error', code: error.code ?? 'network', detail: error.message })
    }
  }

  return [state, load]
}
