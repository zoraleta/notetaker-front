import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { login, setToken } from '../api'
import type { LoginInput } from '../schema'

export function useLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  return useMutation({
    mutationFn: (data: LoginInput) => login(data),
    onSuccess: ({ token }) => {
      setToken(token)
      const from = searchParams.get('from') ?? '/dashboard'
      navigate(from)
    },
  })
}
