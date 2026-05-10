import { useQuery } from '@tanstack/react-query'
import { semanticSearch, aiKeys } from '../api'

export function useSemanticSearch(query: string) {
  return useQuery({
    queryKey: aiKeys.search(query),
    queryFn: () => semanticSearch(query),
    enabled: query.trim().length > 0,
    staleTime: 30_000,
  })
}
