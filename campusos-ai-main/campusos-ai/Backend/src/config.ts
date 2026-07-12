import 'dotenv/config'

const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 3001),

  DATABASE_URL: process.env.DATABASE_URL ?? '',

  JWT_SECRET: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',

  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173'
}

function requireEnv(name: keyof typeof env) {
  if (!env[name] || (typeof env[name] === 'string' && env[name].trim().length === 0)) {
    throw new Error(`Missing required env var: ${String(name)}`)
  }
  return env[name]
}

export const config = {
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  DATABASE_URL: env.DATABASE_URL,

  JWT_SECRET: env.JWT_SECRET,
  JWT_EXPIRES_IN: env.JWT_EXPIRES_IN,
  CORS_ORIGIN: env.CORS_ORIGIN
}


