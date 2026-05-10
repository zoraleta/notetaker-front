import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { register, setToken } from '../api'
import type { RegisterInput } from '../schema'

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: RegisterInput) => register(data),
    onSuccess: ({ token }) => {
      setToken(token)
      navigate('/dashboard')
    },
  })
}
