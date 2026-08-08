import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getAvailableSlots } from './availability';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Rota de Healthcheck (útil para verificar se a API está online no Render)
app.get('/health', (req: Request, res: Response) => {
  return res.json({ status: 'ok', message: 'API da Barbearia rodando!' });
});

// 1. ROTA GET /availability - Consulta de horários disponíveis
app.get('/availability', async (req: Request, res: Response) => {
  try {
    const { barberId, serviceId, date } = req.query;

    if (!barberId || !serviceId || !date) {
      return res.status(400).json({ 
        error: 'Forneça barberId, serviceId e date no formato YYYY-MM-DD.' 
      });
    }

    const slots = await getAvailableSlots(
      String(barberId), 
      String(serviceId), 
      String(date)
    );

    return res.json({ date, slots });
  } catch (error) {
    console.error('Erro na rota de disponibilidade:', error);
    return res.status(500).json({ error: 'Erro ao buscar horários disponíveis.' });
  }
});

// 2. ROTA GET /appointments - Listar agendamentos do dia por barbeiro
app.get('/appointments', async (req: Request, res: Response) => {
  try {
    const { barberId, date } = req.query;

    if (!barberId || !date) {
      return res.status(400).json({ 
        error: 'Forneça barberId e date (YYYY-MM-DD).' 
      });
    }

    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const appointments = await prisma.appointment.findMany({
      where: {
        userId: String(barberId),
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        service: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return res.json({ date, appointments });
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar agendamentos.' });
  }
});

// 3. ROTA POST /appointments - Criar novo agendamento
app.post('/appointments', async (req: Request, res: Response) => {
  try {
    const { barberId, serviceId, clientName, clientPhone, date, time } = req.body;

    if (!barberId || !serviceId || !clientName || !clientPhone || !date || !time) {
      return res.status(400).json({ 
        error: 'Preencha todos os campos: barberId, serviceId, clientName, clientPhone, date e time.' 
      });
    }

    const service = await prisma.service.findUnique({
      where: { id: String(serviceId) },
    });

    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado.' });
    }

    const durationMinutes = (service as any)?.durationInMinutes ?? (service as any)?.duration ?? 30;
    const startTime = new Date(`${date}T${time}:00.000Z`);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const appointment = await prisma.appointment.create({
      data: {
        userId: String(barberId),
        serviceId: String(serviceId),
        clientName: String(clientName),
        clientPhone: String(clientPhone),
        startTime,
        endTime,
      },
    });

    return res.status(201).json({
      message: 'Agendamento realizado com sucesso!',
      appointment,
    });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar o agendamento.' });
  }
});

// 4. ROTA PATCH /appointments/:id/cancel - Cancelar um agendamento
app.patch('/appointments/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado.' });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    return res.json({
      message: 'Agendamento cancelado com sucesso!',
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    return res.status(500).json({ error: 'Erro interno ao cancelar agendamento.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta ${PORT}`);
});