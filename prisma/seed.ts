import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Limpa registros anteriores para evitar duplicidade
  await prisma.appointment.deleteMany();
  await prisma.workingHour.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  // 1. Criar um Barbeiro
  const barber = await prisma.user.create({
    data: {
      name: 'Carlos Barbeiro',
      email: 'carlos@barbearia.com',
      password: '123',
      phone: '16999999999',
      role: 'BARBER',
    },
  });

  // 2. Criar um Serviço (Corte Social - 30 minutos)
  const service = await prisma.service.create({
    data: {
      name: 'Corte Social',
      description: 'Corte tesoura e máquina',
      price: 35.00,
      durationMin: 30,
    },
  });

  // 3. Configurar Expediente de Segunda (1) a Sábado (6) das 09h às 18h com almoço das 12h às 13h
  for (let day = 1; day <= 6; day++) {
    await prisma.workingHour.create({
      data: {
        userId: barber.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '12:00',
        breakEnd: '13:00',
      },
    });
  }

  console.log('Dados de teste criados com sucesso!');
  console.log('ID do Barbeiro:', barber.id);
  console.log('ID do Serviço:', service.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  