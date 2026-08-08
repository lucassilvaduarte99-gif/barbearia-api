import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SlotResponse {
  availableSlots: string[];
}

/**
 * Retorna os horários livres de um barbeiro para um serviço específico em uma data.
 */
export async function getAvailableSlots(
  barberId: string,
  serviceId: string,
  dateString: string
): Promise<string[]> {
  // 1. Buscar a duração do serviço escolhido
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    throw new Error('Serviço não encontrado');
  }

  const durationMin = service.durationMin;

  // 2. Descobrir o dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
  const targetDate = new Date(dateString);
  const dayOfWeek = targetDate.getUTCDay();

  // 3. Buscar a jornada de trabalho do barbeiro no dia
  const workingHour = await prisma.workingHour.findFirst({
    where: {
      userId: barberId,
      dayOfWeek: dayOfWeek,
      active: true,
    },
  });

  if (!workingHour) return []; // Barbeiro não trabalha neste dia

  // 4. Buscar agendamentos existentes no dia
  const startOfDay = new Date(`${dateString}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateString}T23:59:59.999Z`);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      userId: barberId,
      status: 'CONFIRMED',
      startTime: { gte: startOfDay, lte: endOfDay },
    },
  });

  // 5. Auxiliares para conversão de horários
  const timeToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (totalMinutes: number): string => {
    const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const m = String(totalMinutes % 60).padStart(2, '0');
    return `${h}:${m}`;
  };

  const dayStartMin = timeToMinutes(workingHour.startTime);
  const dayEndMin = timeToMinutes(workingHour.endTime);
  const breakStartMin = workingHour.breakStart ? timeToMinutes(workingHour.breakStart) : null;
  const breakEndMin = workingHour.breakEnd ? timeToMinutes(workingHour.breakEnd) : null;

  // 6. Gerar e filtrar os slots de horários
  const availableSlots: string[] = [];

  for (let current = dayStartMin; current + durationMin <= dayEndMin; current += durationMin) {
    const slotStartMin = current;
    const slotEndMin = current + durationMin;

    // Verificar se cruza com o intervalo de almoço
    if (breakStartMin !== null && breakEndMin !== null) {
      if (slotStartMin < breakEndMin && slotEndMin > breakStartMin) {
        continue;
      }
    }

    // Verificar se cruza com algum agendamento já existente
    const hasConflict = existingAppointments.some((appt) => {
      const apptStartMin = appt.startTime.getUTCHours() * 60 + appt.startTime.getUTCMinutes();
      const apptEndMin = appt.endTime.getUTCHours() * 60 + appt.endTime.getUTCMinutes();

      return slotStartMin < apptEndMin && slotEndMin > apptStartMin;
    });

    if (!hasConflict) {
      availableSlots.push(minutesToTime(slotStartMin));
    }
  }

  return availableSlots;
}