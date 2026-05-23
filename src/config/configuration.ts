export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

export default (): AppConfig => {
  const nodeEnv = (process.env.NODE_ENV ??
    'development') as AppConfig['nodeEnv'];
  const databaseUrl = process.env.DATABASE_URL;
  const jwtSecret = process.env.JWT_SECRET;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return {
    port: Number.parseInt(process.env.PORT ?? '3000', 10),
    nodeEnv,
    database: {
      url: databaseUrl,
    },
    jwt: {
      secret: jwtSecret,
      expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    },
  };
};
