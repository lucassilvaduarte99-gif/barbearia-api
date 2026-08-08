import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { getAvailableSlots } from '../availability';

export const handleWhatsAppWebhook = async (req: Request, res: Response) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'Campos phone e message são obrigatórios' });
    }

    const text = message.trim().toLowerCase();
    const barber = await prisma.user.findFirst({ where: { role: 'BARBER' } });
    const service = await prisma.service.findFirst({ where: { name: 'Corte Social' } });

    if (!barber || !service) {
      return res.json({ reply: 'Sistema em manutenção. Tente novamente mais tarde.' });
    }

    if (text.includes('horario') || text.includes('horários') || text === '1') {
      const slots = await getAvailableSlots(barber.id, service.id, '2026-08-10');

      return res.json({
        reply: `💈 *Horários livres para 10/08/2026*:\n\n${slots.join(', ')}\n\nPara agendar, digite: *agendar 09:00 Seu Nome*`
      });
    }

    if (text.startsWith('agendar')) {
      const parts = message.split(' ');
      const time = parts[1];
      const clientName = parts.slice(2).join(' ') || 'Cliente WhatsApp';

      if (!time) {
        return res.json({ reply: 'Por favor informe o horário no formato: *agendar 09:00 Seu Nome*' });
      }

      const date = '2026-08-10';
      const start = new Date(`${date}T${time}:00.000Z`);
      const end = new Date(start.getTime() + service.durationMin * 60000);

      const conflict = await prisma.appointment.findFirst({
        where: {
          userId: barber.id,
          status: { not: 'CANCELLED' },
          AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }]
        }
      });

      if (conflict) {
        return res.json({ reply: `❌ O horário das ${time} já está ocupado!` });
      }

      await prisma.appointment.create({
        data: {
          userId: barber.id,
          serviceId: service.id,
          clientName,
          clientPhone: phone,
          startTime: start,
          endTime: end,
          status: 'CONFIRMED'
        }
      });

      return res.json({
        reply: `✅ *Agendamento Confirmado!*\n\nCliente: ${clientName}\nHorário: ${time}\nData: 10/08/2026`
      });
    }

    return res.json({
      reply: "👋 Olá! Bem-vindo à Barbearia!\n\nRespondas com uma das opções:\n1️⃣ Digite *1* para ver *horários disponíveis*\n2️⃣ Digite *agendar 09:00 Seu Nome* para confirmar um agendamento"
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
