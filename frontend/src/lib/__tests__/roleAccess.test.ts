import { defaultHomePath, canAccessErpRoute, canAccessOrdemServicoByCompany } from '../roleAccess';

describe('defaultHomePath', () => {
  it('redireciona TOTEM para /totem', () => {
    expect(defaultHomePath('TOTEM')).toBe('/totem');
  });
  it('redireciona VENDEDOR para /pdv', () => {
    expect(defaultHomePath('VENDEDOR')).toBe('/pdv');
  });
  it('redireciona ADMIN_EMPRESA para /dashboard', () => {
    expect(defaultHomePath('ADMIN_EMPRESA')).toBe('/dashboard');
  });
  it('redireciona undefined para /dashboard', () => {
    expect(defaultHomePath(undefined)).toBe('/dashboard');
  });
});

describe('canAccessErpRoute', () => {
  it('permite ADMIN_EMPRESA em qualquer rota', () => {
    expect(canAccessErpRoute('ADMIN_EMPRESA', '/dashboard')).toBe(true);
    expect(canAccessErpRoute('ADMIN_EMPRESA', '/relatorios')).toBe(true);
  });

  it('bloqueia VENDEDOR nas rotas restritas', () => {
    expect(canAccessErpRoute('VENDEDOR', '/dashboard')).toBe(false);
    expect(canAccessErpRoute('VENDEDOR', '/products')).toBe(false);
    expect(canAccessErpRoute('VENDEDOR', '/relatorios')).toBe(false);
    expect(canAccessErpRoute('VENDEDOR', '/parametros')).toBe(false);
  });

  it('permite VENDEDOR no PDV e cash', () => {
    expect(canAccessErpRoute('VENDEDOR', '/pdv')).toBe(true);
    expect(canAccessErpRoute('VENDEDOR', '/cash')).toBe(true);
  });

  it('TOTEM só acessa /totem e /primeiro-acesso', () => {
    expect(canAccessErpRoute('TOTEM', '/totem')).toBe(true);
    expect(canAccessErpRoute('TOTEM', '/primeiro-acesso')).toBe(true);
    expect(canAccessErpRoute('TOTEM', '/dashboard')).toBe(false);
    expect(canAccessErpRoute('TOTEM', '/pdv')).toBe(false);
  });
});

describe('canAccessOrdemServicoByCompany', () => {
  it('empresa "default" sempre tem acesso', () => {
    expect(canAccessOrdemServicoByCompany('default', false)).toBe(true);
    expect(canAccessOrdemServicoByCompany('Default', false)).toBe(true);
  });

  it('empresa "sistema" sempre tem acesso', () => {
    expect(canAccessOrdemServicoByCompany('sistema', false)).toBe(true);
  });

  it('empresa normal precisa de módulo informática ativo', () => {
    expect(canAccessOrdemServicoByCompany('Loja ABC', true)).toBe(true);
    expect(canAccessOrdemServicoByCompany('Loja ABC', false)).toBe(false);
    expect(canAccessOrdemServicoByCompany('Loja ABC', null)).toBe(false);
  });
});
