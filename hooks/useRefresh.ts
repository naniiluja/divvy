import { useState } from 'react'

export function useRefresh(refreshFn: () => void) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    refreshFn()
    await new Promise((r) => setTimeout(r, 800))
    setRefreshing(false)
  }

  return { refreshing, handleRefresh }
}
