import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterOrderDto } from './dto/filter-order.dto';
import { OrdersRepository } from './orders.repository';

describe('OrdersRepository', () => {
  let repository: OrdersRepository;
  const prisma = {
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get(OrdersRepository);
    jest.clearAllMocks();
  });

  it('create deve incluir itens na resposta', async () => {
    prisma.order.create.mockResolvedValue({ id: 'order-1', items: [] });

    await expect(
      repository.create({ orderNumber: 'ORD-2026-000001' } as never),
    ).resolves.toEqual({ id: 'order-1', items: [] });
    expect(prisma.order.create).toHaveBeenCalledWith({
      data: { orderNumber: 'ORD-2026-000001' },
      include: { items: true },
    });
  });

  it('findAll deve paginar e retornar total', async () => {
    const orders = [{ id: 'order-1', items: [] }];
    prisma.$transaction.mockResolvedValue([orders, 1]);

    const filters: FilterOrderDto = {
      page: 2,
      limit: 10,
      orderNumber: 'ORD',
      status: OrderStatus.PENDING,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    };

    const result = await repository.findAll('user-1', filters);

    expect(result).toEqual({ data: orders, total: 1 });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('findOne deve filtrar por usuário e excluir deletados', async () => {
    prisma.order.findFirst.mockResolvedValue({ id: 'order-1', items: [] });

    await repository.findOne('order-1', 'user-1');
    expect(prisma.order.findFirst).toHaveBeenCalledWith({
      where: { id: 'order-1', userId: 'user-1', deletedAt: null },
      include: { items: true },
    });
  });

  it('update deve retornar pedido com itens', async () => {
    prisma.order.update.mockResolvedValue({ id: 'order-1', items: [] });

    await repository.update('order-1', { customerName: 'Novo' });
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { customerName: 'Novo' },
      include: { items: true },
    });
  });

  it('softDelete deve preencher deletedAt', async () => {
    prisma.order.update.mockResolvedValue(undefined);

    await repository.softDelete('order-1');
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it('generateOrderNumber deve formatar sequência anual', async () => {
    prisma.order.count.mockResolvedValue(5);
    const year = new Date().getFullYear();

    await expect(repository.generateOrderNumber()).resolves.toBe(
      `ORD-${year}-000006`,
    );
  });
});
