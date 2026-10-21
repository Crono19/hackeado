const parsedPort = Number.parseInt(process.env.PORT ?? '3000', 10);

export const config = {
  host: process.env.HOST ?? '0.0.0.0',
  port: Number.isNaN(parsedPort) ? 3000 : parsedPort,
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
};

