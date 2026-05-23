import configuration from './configuration';

describe('configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('deve carregar configuração a partir das variáveis de ambiente', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.JWT_SECRET = 'secret';
    process.env.PORT = '4000';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.NODE_ENV = 'test';

    expect(configuration()).toEqual({
      port: 4000,
      nodeEnv: 'test',
      database: { url: 'postgresql://localhost:5432/test' },
      jwt: { secret: 'secret', expiresIn: '1h' },
    });
  });

  it('deve usar valores padrão para port, nodeEnv e jwt.expiresIn', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.JWT_SECRET = 'secret';
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.JWT_EXPIRES_IN;

    expect(configuration()).toEqual({
      port: 3000,
      nodeEnv: 'development',
      database: { url: 'postgresql://localhost:5432/test' },
      jwt: { secret: 'secret', expiresIn: '24h' },
    });
  });

  it('deve exigir DATABASE_URL', () => {
    delete process.env.DATABASE_URL;
    process.env.JWT_SECRET = 'secret';

    expect(() => configuration()).toThrow(
      'DATABASE_URL environment variable is required',
    );
  });

  it('deve exigir JWT_SECRET', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    delete process.env.JWT_SECRET;

    expect(() => configuration()).toThrow(
      'JWT_SECRET environment variable is required',
    );
  });
});
