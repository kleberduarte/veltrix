import { z } from 'zod'

// ─── Primitivos ───────────────────────────────────────────────────────────────

function validarCpf(digits: string): boolean {
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(digits[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(digits[10])
}

function validarCnpj(digits: string): boolean {
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false
  const calc = (d: string, w: number[]): number => {
    let s = 0
    for (let i = 0; i < w.length; i++) s += parseInt(d[i]) * w[i]
    const r = s % 11
    return r < 2 ? 0 : 11 - r
  }
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  return calc(digits, w1) === parseInt(digits[12]) &&
         calc(digits, w2) === parseInt(digits[13])
}

const cpf = z
  .string()
  .transform(s => s.replace(/\D/g, ''))
  .refine(d => d.length === 11, 'CPF deve ter 11 dígitos')
  .refine(validarCpf, 'CPF inválido')

const cnpj = z
  .string()
  .transform(s => s.replace(/\D/g, ''))
  .refine(d => d.length === 14, 'CNPJ deve ter 14 dígitos')
  .refine(validarCnpj, 'CNPJ inválido')

const telefone = z
  .string()
  .transform(s => s.replace(/\D/g, ''))
  .refine(d => d.length === 10 || d.length === 11, 'Telefone inválido')

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
    confirmPassword: z.string(),
    codigoConvite: z.string().optional(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export const changePasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine(d => d.newPassword === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

// ─── Produto ──────────────────────────────────────────────────────────────────

export const productSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  preco: z.number().positive('Preço deve ser positivo'),
  estoque: z.number().int('Estoque deve ser inteiro').min(0, 'Estoque não pode ser negativo').optional(),
  codigoBarras: z.string().optional(),
  descricao: z.string().optional(),
})

// ─── Cliente ──────────────────────────────────────────────────────────────────

export const clienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: telefone.optional(),
  cpf: cpf.optional(),
  cnpj: cnpj.optional(),
})

// ─── Empresa ──────────────────────────────────────────────────────────────────

export const empresaSchema = z.object({
  nomeEmpresa: z.string().min(2, 'Nome da empresa obrigatório'),
  cnpj: cnpj.optional(),
  telefone: telefone.optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  corPrimaria: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida (use hex #rrggbb)').optional(),
})

// ─── Tipos inferidos ──────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ProductInput = z.infer<typeof productSchema>
export type ClienteInput = z.infer<typeof clienteSchema>
export type EmpresaInput = z.infer<typeof empresaSchema>
