import { z } from 'zod'

// ─── Primitivos ───────────────────────────────────────────────────────────────

const cpf = z
  .string()
  .transform(s => s.replace(/\D/g, ''))
  .refine(d => d.length === 11, 'CPF deve ter 11 dígitos')

const cnpj = z
  .string()
  .transform(s => s.replace(/\D/g, ''))
  .refine(d => d.length === 14, 'CNPJ deve ter 14 dígitos')

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
