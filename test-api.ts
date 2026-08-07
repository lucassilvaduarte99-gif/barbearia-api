import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testApi() {
  const barber = await prisma.user.findFirst({ where: { role: 'BARBER' } });
  const service = await prisma.service.findFirst({ where: { name: 'Corte Social' } });

  if (!barber || !service) return;

  const date = '2026-08-10';

  console.log('\n--- 1. Criando primeiro agendamento às 10:00 ---');
  const res1 = await fetch('http://localhost:3000/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      barberId: barber.id,
      serviceId: service.id,
      clientName: 'Cliente 1',
      clientPhone: '16999991111',
      startTime: `${date}T10:00:00.000Z`,
    }),
  });
  console.log('Status 1:', res1.status);

  console.log('\n--- 2. Testando duplicidade (Tentando agendar às 10:00 novamente) ---');
  const res2 = await fetch('http://localhost:3000/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      barberId: barber.id,
      serviceId: service.id,
      clientName: 'Cliente 2',
      clientPhone: '16999992222',
      startTime: `${date}T10:00:00.000Z`,
    }),
  });
  const errData = await res2.json();
  console.log('Status 2 (Esperado 409):', res2.status, errData);

  console.log('\n--- 3. Listando agendamentos do dia ---');
  const res3 = await fetch(`http://localhost:3000/appointments?barberId=${barber.id}&date=${date}`);
  const list = await res3.json();
  console.log('Agendamentos no dia:', list.length);

  if (list.length > 0) {
    console.log('\n--- 4. Cancelando o agendamento criado ---');
    const cancelRes = await fetch(`http://localhost:3000/appointments/${list[0].id}/cancel`, {
      method: 'PATCH',
    });
    console.log('Status Cancelamento:', cancelRes.status);
  }
}

testApi().finally(() => prisma.$disconnect());
