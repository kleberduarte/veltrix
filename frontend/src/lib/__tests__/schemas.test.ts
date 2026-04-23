import { loginSchema, registerSchema, productSchema, clienteSchema } from '../schemas'

describe('loginSchema', () => {
  it('valida dados corretos', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '123456' }).success).toBe(true)
  })
  it('rejeita e-mail inválido', () => {
    expect(loginSchema.safeParse({ email: 'invalido', password: '123' }).success).toBe(false)
  })
  it('rejeita senha vazia', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('rejeita quando senhas não coincidem', () => {
    const result = registerSchema.safeParse({
      name: 'João',
      email: 'joao@teste.com',
      password: 'senha1234',
      confirmPassword: 'outrasenha',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'))
      expect(paths).toContain('confirmPassword')
    }
  })

  it('valida registro completo', () => {
    expect(registerSchema.safeParse({
      name: 'João Silva',
      email: 'joao@teste.com',
      password: 'senha1234',
      confirmPassword: 'senha1234',
    }).success).toBe(true)
  })
})

describe('productSchema', () => {
  it('valida produto correto', () => {
    expect(productSchema.safeParse({ nome: 'Produto X', preco: 29.9 }).success).toBe(true)
  })
  it('rejeita preço negativo', () => {
    expect(productSchema.safeParse({ nome: 'X', preco: -1 }).success).toBe(false)
  })
  it('rejeita nome vazio', () => {
    expect(productSchema.safeParse({ nome: '', preco: 10 }).success).toBe(false)
  })
})

describe('clienteSchema', () => {
  it('valida cliente com dados mínimos', () => {
    expect(clienteSchema.safeParse({ nome: 'Maria' }).success).toBe(true)
  })
  it('rejeita nome muito curto', () => {
    expect(clienteSchema.safeParse({ nome: 'M' }).success).toBe(false)
  })
})
