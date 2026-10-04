import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { syncScenarioFromCurrentLocation } from './scenarioStore'

export function ScenarioRouteSync() {
  const location = useLocation()

  useEffect(() => {
    syncScenarioFromCurrentLocation()
  }, [location.pathname, location.search])

  return null
}
