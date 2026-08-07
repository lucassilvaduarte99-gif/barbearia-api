import cron from 'node-cron';
import { prisma } from '../config/prisma';

export const startReminderCron = () => {
  // Roda a cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60000);

      // Busca agendamentos confirmados na próxima hora
      const upcomingAppointments = await prisma.appointment.findMany({
        where: {
          status: 'CONFIRMED',
          startTime: {
            gte: now,
            lte: inOneHour,
          },
        },
        include: { service: true },
      });

      for (const app of upcomingAppointments) {
        const time = new Date(app.startTime).toISOString().substr(11, 5);
        
        console.log(`\n🔔 [LEMBRETE DISPARADO]`);
        console.log(`📱 Enviando mensagem para: ${app.clientPhone}`);
        console.log(`💬 "Olá, ${app.clientName}! Seu agendamento para ${app.service.name} está confirmado para hoje às ${time}."\n`);
      }
    } catch (error) {
      console.error('Erro ao processar lembretes:', error);
    }
  });

  console.log('⏰ Serviço de lembretes automáticos ativado (checagem a cada 5 min)');
};
