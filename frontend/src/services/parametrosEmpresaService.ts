import api from '@/lib/api'
import { ParametroEmpresa, Segmento, TipoEstabelecimentoFastFood } from '@/types'

export type ParametroEmpresaPayload = {
  nomeEmpresa?: string
  logoUrl?: string
  mensagemBoasVindas?: string
  corPrimaria?: string
  corSecundaria?: string
  corFundo?: string
  corTexto?: string
  corBotao?: string
  corBotaoTexto?: string
  chavePix?: string
  suporteEmail?: string
  suporteWhatsapp?: string
  segmento?: Segmento
  moduloFarmaciaAtivo?: boolean
  farmaciaLoteValidadeObrigatorio?: boolean
  farmaciaControladosAtivo?: boolean
  farmaciaAntimicrobianosAtivo?: boolean
  farmaciaPmcAtivo?: boolean
  farmaciaPmcModo?: string
  moduloInformaticaAtivo?: boolean
  moduloFastFoodAtivo?: boolean
  tipoEstabelecimentoFastFood?: TipoEstabelecimentoFastFood | null
  cnpj?: string
  inscricaoMunicipal?: string
  telefoneComercial?: string
  fax?: string
  emailComercial?: string
  enderecoLinha1Os?: string
  cidadeUfOs?: string
  textoTermosOs?: string
}

export const parametrosEmpresaService = {
  async get(): Promise<ParametroEmpresa | null> {
    const { data } = await api.get('/parametros-empresa')
    return data
  },

  async save(payload: ParametroEmpresaPayload): Promise<ParametroEmpresa> {
    const { data } = await api.post('/parametros-empresa', payload)
    return data
  },
}
