import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrderDto } from './dto/filter-order.dto';
import { OrdersRepository, OrderWithItems } from './orders.repository';
import { OrdersService } from './orders.service';

const buildOrder = (
  overrides: Partial<OrderWithItems> = {},
): OrderWithItems => ({
  id: 'order-1',
  orderNumber: 'ORD-2026-000001',
  status: OrderStatus.PENDING,
  deliveryDate: new Date('2026-12-31'),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  customerName: 'Cliente Teste',
  customerDocument: '123.456.789-00',
  addressStreet: 'Rua das Entregas',
  addressNumber: '10',
  addressComplement: null,
  addressDistrict: 'Centro',
  addressCity: 'Itajaí',
  addressState: 'SC',
  addressZipCode: '88301-100',
  userId: 'user-1',
  items: [],
  ...overrides,
});

const buildCreateDto = (): CreateOrderDto => ({
  deliveryDate: '2026-12-31T00:00:00.000Z',
  customerName: 'Cliente Teste',
  customerDocument: '123.456.789-00',
  addressStreet: 'Rua das Entregas',
  addressNumber: '10',
  addressDistrict: 'Centro',
  addressCity: 'Itajaí',
  addressState: 'SC',
  addressZipCode: '88301-100',
  items: [{ description: 'Produto', price: 19.9, quantity: 1 }],
});

describe('OrdersService', () => {
  let service: OrdersService;
  const repository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    generateOrderNumber: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: OrdersRepository, useValue: repository },
      ],
    }).compile();

    service = module.get(OrdersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve gerar orderNumber e persistir o pedido vinculado ao usuário', async () => {
      repository.generateOrderNumber.mockResolvedValue('ORD-2026-000001');
      repository.create.mockResolvedValue(buildOrder());

      const result = await service.create('user-1', buildCreateDto());

      expect(repository.generateOrderNumber).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orderNumber: 'ORD-2026-000001',
          user: { connect: { id: 'user-1' } },
        }),
      );
      expect(result.id).toBe('order-1');
    });
  });

  describe('findOne', () => {
    it('deve retornar o pedido quando encontrado', async () => {
      const order = buildOrder();
      repository.findOne.mockResolvedValue(order);

      await expect(service.findOne('order-1', 'user-1')).resolves.toBe(order);
      expect(repository.findOne).toHaveBeenCalledWith('order-1', 'user-1');
    });

    it('deve lançar NotFoundException quando o pedido não pertence ao usuário', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('order-1', 'user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('deve construir os metadados de paginação corretamente', async () => {
      repository.findAll.mockResolvedValue({
        data: [buildOrder()],
        total: 25,
      });

      const filters: FilterOrderDto = { page: 2, limit: 10 };
      const result = await service.findAll('user-1', filters);

      expect(result.meta).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      });
    });

    it('deve recusar startDate maior que endDate', async () => {
      const filters: FilterOrderDto = {
        page: 1,
        limit: 20,
        startDate: '2026-12-31',
        endDate: '2026-01-01',
      };

      await expect(service.findAll('user-1', filters)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('deve aplicar soft delete somente após validar a posse do pedido', async () => {
      repository.findOne.mockResolvedValue(buildOrder());
      repository.softDelete.mockResolvedValue(undefined);

      await service.remove('order-1', 'user-1');

      expect(repository.findOne).toHaveBeenCalledWith('order-1', 'user-1');
      expect(repository.softDelete).toHaveBeenCalledWith('order-1');
    });

    it('não deve chamar softDelete se o pedido não existir', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('order-1', 'user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.softDelete).not.toHaveBeenCalled();
    });
  });
});
