import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { getAvailableSlots } from '../../availability';

// Rota pública para obter Barbeiro e Serviço padrão
export const getServices = async (req: Request, res: Response) => {
  try {
    const barber = await prisma.user.findFirst({ where: { role: 'BARBER' } });
    const service = await prisma.service.findFirst();

    if (!barber || !service) {
      return res.status(404).json({ error: 'Barbeiro ou serviço não encontrado' });
    }

    return res.json({ barberId: barber.id, serviceId: service.id });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAvailability = async (req: Request, res: Response) => {
  try {
    const { barberId, serviceId, date } = req.query;

    if (!barberId || !serviceId || !date) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios ausentes: barberId, serviceId e date (YYYY-MM-DD)',
      });
    }

    const slots = await getAvailableSlots(
      String(barberId),
      String(serviceId),
      String(date)
    );

    return res.json({ date, availableSlots: slots });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { barberId, serviceId, clientName, clientPhone, startTime } = req.body;

    if (!barberId || !serviceId || !clientName || !clientPhone || !startTime) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.durationMin * 60000);

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        userId: barberId,
        status: { not: 'CANCELLED' },
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } }
        ]
      }
    });

    if (conflictingAppointment) {
      return res.status(409).json({ error: 'Este horário já está ocupado.' });
    }

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

    return res.status(201).json(appointment);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const listAppointments = async (req: Request, res: Response) => {
  try {
    const { barberId, date } = req.query;

    if (!barberId || !date) {
      return res.status(400).json({ error: 'Parâmetros barberId e date (YYYY-MM-DD) são obrigatórios' });
    }

    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const appointments = await prisma.appointment.findMany({
      where: {
        userId: String(barberId),
        startTime: { gte: startOfDay, lte: endOfDay },
      },
      include: { service: true },
      orderBy: { startTime: 'asc' },
    });

    return res.json(appointments);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return res.json({ message: 'Agendamento cancelado com sucesso', appointment: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
