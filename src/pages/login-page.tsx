import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useLogin } from '@/features/auth/hooks/use-login'
import { loginSchema, type LoginInput } from '@/features/auth/schema'

export function LoginPage() {
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })
  const { mutate, isPending, error } = useLogin()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Вход</h1>
          <p className="text-sm text-muted-foreground">Введите email и пароль</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutate(d))} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Пароль</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <p className="text-sm text-destructive">
                {(error as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Неверный email или пароль'}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-foreground underline underline-offset-4 hover:text-primary">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  )
}
