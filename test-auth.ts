import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runAuthTest() {
  const barber = await prisma.user.findFirst({ where: { role: 'BARBER' } });
  if (!barber) return;

  console.log('--- 1. Tentando listar agendamentos SEM token (Esperado: 401) ---');
  const resUnauthorized = await fetch(`http://localhost:3000/appointments?barberId=${barber.id}&date=2026-08-10`);
  console.log('Status sem token:', resUnauthorized.status);

  console.log('\n--- 2. Realizando Login para obter Token JWT ---');
  const loginRes = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: barber.email,
      password: '123' // Senha definida no seed
    })
  });
  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status);
  console.log('Token obtido com sucesso!');

  if (loginData.token) {
    console.log('\n--- 3. Listando agendamentos COM token JWT ---');
    const resAuth = await fetch(`http://localhost:3000/appointments?barberId=${barber.id}&date=2026-08-10`, {
      headers: { Authorization: `Bearer ${loginData.token}` }
    });
    const list = await resAuth.json();
    console.log('Status com token:', resAuth.status);
    console.log('Total de agendamentos retornado:', list.length);
  }
}

runAuthTest().finally(() => prisma.$disconnect());
