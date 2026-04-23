import {
  onlyDigits,
  formatCpfDisplay,
  formatCnpjDisplay,
  formatPhoneBrDisplay,
  isValidCpfDigits,
  isValidCnpjDigits,
  parseApiFieldErrors,
} from '../brDocuments';

describe('onlyDigits', () => {
  it('remove letras e símbolos', () => {
    expect(onlyDigits('123.456-78')).toBe('12345678');
  });
  it('retorna string vazia para entrada vazia', () => {
    expect(onlyDigits('')).toBe('');
  });
});

describe('formatCpfDisplay', () => {
  it('formata CPF completo', () => {
    expect(formatCpfDisplay('12345678901')).toBe('123.456.789-01');
  });
  it('formata CPF parcial', () => {
    expect(formatCpfDisplay('123456')).toBe('123.456');
  });
  it('aceita CPF já formatado como entrada', () => {
    expect(formatCpfDisplay('123.456.789-01')).toBe('123.456.789-01');
  });
});

describe('formatCnpjDisplay', () => {
  it('formata CNPJ completo', () => {
    expect(formatCnpjDisplay('11222333000181')).toBe('11.222.333/0001-81');
  });
  it('formata CNPJ parcial', () => {
    expect(formatCnpjDisplay('112223')).toBe('11.222.3');
  });
});

describe('formatPhoneBrDisplay', () => {
  it('formata celular com 11 dígitos', () => {
    expect(formatPhoneBrDisplay('11987654321')).toBe('(11) 98765-4321');
  });
  it('formata telefone fixo com 10 dígitos', () => {
    expect(formatPhoneBrDisplay('1133334444')).toBe('(11) 3333-4444');
  });
  it('retorna vazio para entrada vazia', () => {
    expect(formatPhoneBrDisplay('')).toBe('');
  });
});

describe('isValidCpfDigits', () => {
  it('valida CPF correto', () => {
    expect(isValidCpfDigits('11144477735')).toBe(true);
  });
  it('rejeita CPF com todos dígitos iguais', () => {
    expect(isValidCpfDigits('11111111111')).toBe(false);
  });
  it('rejeita CPF com comprimento errado', () => {
    expect(isValidCpfDigits('1234567890')).toBe(false);
  });
  it('rejeita CPF com dígito verificador errado', () => {
    expect(isValidCpfDigits('11144477736')).toBe(false);
  });
});

describe('isValidCnpjDigits', () => {
  it('valida CNPJ correto', () => {
    expect(isValidCnpjDigits('11222333000181')).toBe(true);
  });
  it('rejeita CNPJ com todos dígitos iguais', () => {
    expect(isValidCnpjDigits('11111111111111')).toBe(false);
  });
  it('rejeita CNPJ com comprimento errado', () => {
    expect(isValidCnpjDigits('1122233300018')).toBe(false);
  });
});

describe('parseApiFieldErrors', () => {
  it('extrai mensagem e campos de erro de validação', () => {
    const err = {
      response: {
        data: {
          error: 'Validation failed',
          fields: { email: 'Email inválido' },
        },
      },
    };
    const result = parseApiFieldErrors(err);
    expect(result.fields).toEqual({ email: 'Email inválido' });
    expect(result.message).toBe('Corrija os campos destacados.');
  });

  it('usa mensagem customizada quando não é validation failed', () => {
    const err = {
      response: { data: { error: 'Email já cadastrado', fields: {} } },
    };
    const result = parseApiFieldErrors(err);
    expect(result.message).toBe('Email já cadastrado');
  });

  it('retorna fallback para erro sem estrutura', () => {
    const result = parseApiFieldErrors(new Error('network error'));
    expect(result.message).toBe('Erro ao salvar.');
    expect(result.fields).toEqual({});
  });
});
