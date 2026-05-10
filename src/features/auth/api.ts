import { z } from 'zod'
import { http } from '@/lib/http'
import type { LoginInput, RegisterInput } from './schema'

const authResponseSchema = z.object({
  token: z.string(),
})

export async function login(data: LoginInput) {
  const res = await http.post('/auth/login', data)
  return authResponseSchema.parse(res.data)
}

export async function register(data: RegisterInput) {
  const res = await http.post('/auth/register', data)
  return authResponseSchema.parse(res.data)
}

export function getToken() {
  return localStorage.getItem('token')
}

export function setToken(token: string) {
  localStorage.setItem('token', token)
}

export function removeToken() {
  localStorage.removeItem('token')
}

export function hasAuthToken() {
  return !!getToken()
}
