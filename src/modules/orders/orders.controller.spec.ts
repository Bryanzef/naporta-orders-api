import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrderDto } from './dto/filter-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  const ordersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const user = { id: 'user-1', email: 'a@b.com', name: 'User' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: ordersService }],
    }).compile();

    controller = module.get(OrdersController);
    jest.clearAllMocks();
  });

  it('create deve delegar ao service com o usuário autenticado', async () => {
    const dto = {} as CreateOrderDto;
    ordersService.create.mockResolvedValue({ id: 'order-1' });

    await expect(controller.create(user, dto)).resolves.toEqual({
      id: 'order-1',
    });
    expect(ordersService.create).toHaveBeenCalledWith('user-1', dto);
  });

  it('findAll deve delegar filtros ao service', async () => {
    const filters = { page: 1, limit: 10 } as FilterOrderDto;
    ordersService.findAll.mockResolvedValue({ data: [], meta: {} });

    await controller.findAll(user, filters);
    expect(ordersService.findAll).toHaveBeenCalledWith('user-1', filters);
  });

  it('findOne deve buscar pedido pelo id do usuário', async () => {
    ordersService.findOne.mockResolvedValue({ id: 'order-1' });

    await expect(
      controller.findOne(user, '550e8400-e29b-41d4-a716-446655440000'),
    ).resolves.toEqual({ id: 'order-1' });
    expect(ordersService.findOne).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
      'user-1',
    );
  });

  it('update deve delegar alteração ao service', async () => {
    const dto: UpdateOrderDto = { status: OrderStatus.DELIVERED };
    ordersService.update.mockResolvedValue({ id: 'order-1' });

    await controller.update(
      user,
      '550e8400-e29b-41d4-a716-446655440000',
      dto,
    );
    expect(ordersService.update).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
      'user-1',
      dto,
    );
  });

  it('remove deve delegar exclusão ao service', async () => {
    ordersService.remove.mockResolvedValue(undefined);

    await controller.remove(
      user,
      '550e8400-e29b-41d4-a716-446655440000',
    );
    expect(ordersService.remove).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
      'user-1',
    );
  });
});
