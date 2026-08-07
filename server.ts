import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { getAvailableSlots } from './availability';

const app = express();
const prisma = new PrismaClient();

// Middlewares
app.use(express.json());

// Servir arquivos estáticos da pasta public (se existir)
app.use(express.static(path.join(__dirname, '../public')));

// Rota 1: Status da API / Frontend
app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'API Barbearia rodando com sucesso!' });
});

// Rota 2: Buscar horários disponíveis
app.get('/availability', async (req: Request, res: Response) => {
  try {
    const { barberId, serviceId, date } = req.query;

    if (!barberId || !serviceId || !date) {
      res.status(400).json({
        error: 'Parâmetros obrigatórios ausentes: barberId, serviceId e date (YYYY-MM-DD)',
      });
      return;
    }

    const slots = await getAvailableSlots(
      String(barberId),
      String(serviceId),
      String(date)
    );

    res.json({ date, availableSlots: slots });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Rota 3: Criar um novo agendamento
app.post('/appointments', async (req: Request, res: Response) => {
  try {
    const { barberId, serviceId, clientName, clientPhone, startTime } = req.body;

    if (!barberId || !serviceId || !clientName || !clientPhone || !startTime) {
      res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      return;
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      res.status(404).json({ error: 'Serviço não encontrado' });
      return;
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.durationMin * 60000);

    const appointment = await prisma.appointment.create({
      data: {
        userId: barberId,
        serviceId: serviceId,
        clientName,
        clientPhone,
        startTime: start,
        endTime: end,
        status: 'CONFIRMED',
      },
    });

    res.status(201).json(appointment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/// Rota raiz de teste
app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'API Barbearia rodando com sucesso!' });
});/ Configuração da porta do Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
