import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ==========================
// Middlewares Globais
// ==========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================
// Rotas
// ==========================
// Health Check (Verificação de status do servidor)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Registrar rotas modulares da API aqui:
// app.use('/api', router);

// ==========================
// Tratamento de Erros
// ==========================
// Handler para rotas inexistentes (404)
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Middleware de erro global
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Erro no Servidor]:', err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// ==========================
// Inicialização & Shutdown
// ==========================
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

// Encerramento gracioso (Graceful Shutdown)
const shutdown = (signal: string) => {
  console.log(`\nSinal ${signal} recebido. Encerrando servidor...`);
  server.close(() => {
    console.log('Servidor finalizado com sucesso.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));