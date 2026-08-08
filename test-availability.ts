import { PrismaClient } from '@prisma/client';
import { getAvailableSlots } from './src/availability';

const prisma = new PrismaClient();

async function runTest() {
  console.log('--- Iniciando teste de disponibilidade ---');

  // Busca o barbeiro e o serviço que criamos no seed
  const barber = await prisma.user.findFirst({ where: { role: 'BARBER' } });
  const service = await prisma.service.findFirst({ where: { name: 'Corte Social' } });

  if (!barber || !service) {
    console.error('Execute o seed primeiro para criar o barbeiro e o serviço.');
    return;
  }

  // Define uma data de teste (Segunda-feira)
  const testDate = '2026-08-10';

  console.log(`Buscando horários disponíveis para ${barber.name}...`);
  console.log(`Serviço: ${service.name} (${service.durationMin} min)`);
  console.log(`Data: ${testDate}\n`);

  const slots = await getAvailableSlots(barber.id, service.id, testDate);

  console.log('Horários Livres Encontrados:');
  console.log(slots);
}

runTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());