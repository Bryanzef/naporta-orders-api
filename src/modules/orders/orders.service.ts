import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResponse } from '../../common/types/paginated-response.type';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrderDto } from './dto/filter-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderWithItems, OrdersRepository } from './orders.repository';

@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  async create(userId: string, dto: CreateOrderDto): Promise<OrderWithItems> {
    this.assertDateRange(dto.deliveryDate);

    const orderNumber = await this.ordersRepository.generateOrderNumber();

    try {
      return await this.ordersRepository.create({
        orderNumber,
        deliveryDate: new Date(dto.deliveryDate),
        customerName: dto.customerName,
        customerDocument: dto.customerDocument,
        addressStreet: dto.addressStreet,
        addressNumber: dto.addressNumber,
        addressComplement: dto.addressComplement,
        addressDistrict: dto.addressDistrict,
        addressCity: dto.addressCity,
        addressState: dto.addressState,
        addressZipCode: dto.addressZipCode,
        user: { connect: { id: userId } },
        items: {
          create: dto.items.map((item) => ({
            description: item.description,
            price: new Prisma.Decimal(item.price),
            quantity: item.quantity,
          })),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Número de pedido duplicado, tente novamente',
        );
      }
      throw error;
    }
  }

  async findAll(
    userId: string,
    filters: FilterOrderDto,
  ): Promise<PaginatedResponse<OrderWithItems>> {
    this.assertFilterDateRange(filters);

    const { data, total } = await this.ordersRepository.findAll(
      userId,
      filters,
    );
    const totalPages = Math.max(1, Math.ceil(total / filters.limit));

    return {
      data,
      meta: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages,
        hasNext: filters.page * filters.limit < total,
        hasPrev: filters.page > 1,
      },
    };
  }

  async findOne(id: string, userId: string): Promise<OrderWithItems> {
    const order = await this.ordersRepository.findOne(id, userId);
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    return order;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateOrderDto,
  ): Promise<OrderWithItems> {
    await this.findOne(id, userId);

    if (dto.deliveryDate) {
      this.assertDateRange(dto.deliveryDate);
    }

    const data: Prisma.OrderUpdateInput = {
      ...(dto.deliveryDate && { deliveryDate: new Date(dto.deliveryDate) }),
      ...(dto.status && { status: dto.status }),
      ...(dto.customerName !== undefined && { customerName: dto.customerName }),
      ...(dto.customerDocument !== undefined && {
        customerDocument: dto.customerDocument,
      }),
      ...(dto.addressStreet !== undefined && {
        addressStreet: dto.addressStreet,
      }),
      ...(dto.addressNumber !== undefined && {
        addressNumber: dto.addressNumber,
      }),
      ...(dto.addressComplement !== undefined && {
        addressComplement: dto.addressComplement,
      }),
      ...(dto.addressDistrict !== undefined && {
        addressDistrict: dto.addressDistrict,
      }),
      ...(dto.addressCity !== undefined && { addressCity: dto.addressCity }),
      ...(dto.addressState !== undefined && { addressState: dto.addressState }),
      ...(dto.addressZipCode !== undefined && {
        addressZipCode: dto.addressZipCode,
      }),
      ...(dto.items && {
        items: {
          deleteMany: {},
          create: dto.items.map((item) => ({
            description: item.description,
            price: new Prisma.Decimal(item.price),
            quantity: item.quantity,
          })),
        },
      }),
    };

    return this.ordersRepository.update(id, data);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.ordersRepository.softDelete(id);
  }

  private assertDateRange(rawDate: string): void {
    const value = new Date(rawDate);
    if (Number.isNaN(value.getTime())) {
      throw new BadRequestException('Data inválida');
    }
  }

  private assertFilterDateRange(filters: FilterOrderDto): void {
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      if (start.getTime() > end.getTime()) {
        throw new BadRequestException(
          'startDate não pode ser maior que endDate',
        );
      }
    }
  }
}
