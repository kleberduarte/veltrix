export type TipoProduto = 'UNIDADE' | 'CAIXA'
export type TipoControle = 'COMUM' | 'ANTIMICROBIANO' | 'CONTROLADO'

export interface Product {
  id: number
  name: string
  codigoProduto?: string | null
  gtinEan?: string | null
  descricao?: string | null
  categoria?: string | null
  price: number
  precoPromocional?: number | null
  emPromocao?: boolean
  estoqueMinimo?: number
  stock: number
  active: boolean
  tipo?: TipoProduto
  tipoControle?: TipoControle
  exigeReceita?: boolean
  exigeLote?: boolean
  exigeValidade?: boolean
  registroMs?: string | null
  pmc?: number | null
  createdAt: string
}

export interface OrderItem {
  productId: number
  productName: string
  quantity: number
  price: number
  subtotal: number
}

export type FormaPagamento = 'DINHEIRO' | 'DEBITO' | 'CARTAO' | 'PIX'

export interface Order {
  id: number
  subtotal?: number
  desconto?: number
  total: number
  status: string
  formaPagamento?: FormaPagamento
  parcelas?: number
  cpfCliente?: string | null
  clienteId?: number | null
  nomeOperador?: string | null
  createdAt: string
  items: OrderItem[]
}

export interface CashFlow {
  id: number
  type: 'IN' | 'OUT'
  amount: number
  description: string
  createdAt: string
}

export interface DailyReport {
  totalSales: number
  totalOrders: number
  averageTicket: number
  totalIn: number
  totalOut: number
  balance: number
}

export interface CartItem {
  product: Product
  quantity: number
  loteCodigo?: string
  loteValidade?: string
}

export type Segmento = 'GERAL' | 'FARMACIA' | 'INFORMATICA'
export type Role = 'ADM' | 'ADMIN_EMPRESA' | 'VENDEDOR'
export type StatusOrdemServico =
  | 'ABERTA'
  | 'EM_ANALISE'
  | 'AGUARDANDO_APROVACAO'
  | 'CONCLUIDA'
  | 'ENTREGUE'
  | 'CANCELADA'
export type StatusCaixa = 'LIVRE' | 'OCUPADO'

export interface Cliente {
  id: number
  nome: string
  email?: string | null
  telefone?: string | null
  cpf?: string | null
  cep?: string | null
  endereco?: string | null
  codigoConvitePdv?: string | null
  createdAt: string
}

export interface ParametroEmpresa {
  id: number
  companyId: number
  nomeEmpresa?: string | null
  logoUrl?: string | null
  mensagemBoasVindas?: string | null
  corPrimaria?: string | null
  corSecundaria?: string | null
  corFundo?: string | null
  corTexto?: string | null
  corBotao?: string | null
  corBotaoTexto?: string | null
  chavePix?: string | null
  suporteEmail?: string | null
  suporteWhatsapp?: string | null
  segmento?: Segmento | null
  moduloFarmaciaAtivo?: boolean | null
  farmaciaLoteValidadeObrigatorio?: boolean | null
  farmaciaControladosAtivo?: boolean | null
  farmaciaAntimicrobianosAtivo?: boolean | null
  farmaciaPmcAtivo?: boolean | null
  farmaciaPmcModo?: string | null
  moduloInformaticaAtivo?: boolean | null
  cnpj?: string | null
  inscricaoMunicipal?: string | null
  telefoneComercial?: string | null
  fax?: string | null
  emailComercial?: string | null
  enderecoLinha1Os?: string | null
  cidadeUfOs?: string | null
  textoTermosOs?: string | null
}

export interface PdvTerminal {
  id: number
  codigo: string
  nome: string
  ativo: boolean
  ultimoOperador?: string | null
  ultimoHeartbeat?: string | null
  statusCaixa: StatusCaixa
}

export interface ResumoDia {
  quantidadeVendas: number
  totalDinheiro: number
  totalCartao: number
  totalDebito: number
  totalPix: number
  totalGeral: number
  jaFechado: boolean
}

export interface FechamentoCaixaRow {
  id: number
  nomeOperador?: string | null
  dataReferencia: string
  dataFechamento: string
  quantidadeVendas: number
  totalDinheiro: number
  totalCartao: number
  totalDebito: number
  totalPix: number
  totalGeral: number
  valorInformadoDinheiro: number
  diferencaDinheiro: number
}

export interface OrdemServico {
  id: number
  numeroOs: number
  clienteId?: number | null
  nomeCliente: string
  telefoneCliente?: string | null
  contatoCliente?: string | null
  equipamento?: string | null
  marca?: string | null
  modelo?: string | null
  numeroSerie?: string | null
  acessorios?: string | null
  defeitoRelatado?: string | null
  diagnostico?: string | null
  servicoExecutado?: string | null
  tecnicoResponsavel?: string | null
  observacao?: string | null
  valorServico?: number | null
  desconto?: number | null
  valorTotal?: number | null
  status: StatusOrdemServico
  dataAbertura: string
  dataPrevisaoEntrega?: string | null
  dataConclusao?: string | null
  dataEntrega?: string | null
  vendaId?: number | null
  createdAt: string
}

export interface ProdutoLote {
  id: number
  productId: number
  codigoLote: string
  validade?: string | null
  quantidadeAtual: number
  createdAt: string
}

export interface AppUser {
  id: number
  name: string
  email: string
  role: Role
  telefone?: string | null
  mustChangePassword?: boolean | null
  companyId: number
  companyName?: string | null
  pdvTerminalId?: number | null
  pdvTerminalCodigo?: string | null
  createdAt: string
}

export type CompanyOption = { id: number; name: string; systemDefault?: boolean; onboardingToken?: string | null }
