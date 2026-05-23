import { PrismaClient, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SAMPLE_USER = {
  name: 'Dev naPorta',
  email: 'dev@naporta.com.br',
  password: 'senha123',
};

const ORDERS_TO_CREATE = 10;

async function main(): Promise<void> {
  console.log('Iniciando seed...');

  const passwordHash = await bcrypt.hash(SAMPLE_USER.password, 12);

  const user = await prisma.user.upsert({
    where: { email: SAMPLE_USER.email },
    update: {},
    create: {
      name: SAMPLE_USER.name,
      email: SAMPLE_USER.email,
      passwordHash,
    },
  });

  const statuses: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.IN_TRANSIT,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ];

  const now = Date.now();
  const ONE_DAY_MS = 86_400_000;

  for (let i = 1; i <= ORDERS_TO_CREATE; i++) {
    const orderNumber = `ORD-2026-${String(i).padStart(6, '0')}`;
    const status = statuses[i % statuses.length];

    await prisma.order.upsert({
      where: { orderNumber },
      update: {},
      create: {
        orderNumber,
        status,
        deliveryDate: new Date(now + i * ONE_DAY_MS),
        customerName: `Cliente Exemplo ${i}`,
        customerDocument: `${String(i).padStart(3, '0')}.456.789-00`,
        addressStreet: 'Rua das Entregas',
        addressNumber: String(i * 10),
        addressDistrict: 'Centro',
        addressCity: 'Itajaí',
        addressState: 'SC',
        addressZipCode: '88301-100',
        userId: user.id,
        items: {
          create: [
            {
              description: `Produto A - Pedido ${i}`,
              price: 49.9,
              quantity: 2,
            },
            {
              description: `Produto B - Pedido ${i}`,
              price: 19.9,
              quantity: 1,
            },
          ],
        },
      },
    });
  }

  console.log(`Seed concluído. ${ORDERS_TO_CREATE} pedidos criados/atualizados.`);
  console.log(`Login: ${SAMPLE_USER.email}`);
  console.log(`Senha: ${SAMPLE_USER.password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
