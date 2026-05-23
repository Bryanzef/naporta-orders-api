import { Injectable } from '@nestjs/common';
import { Order, OrderItem, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterOrderDto } from './dto/filter-order.dto';

export type OrderWithItems = Order & { items: OrderItem[] };

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.OrderCreateInput): Promise<OrderWithItems> {
    return this.prisma.order.create({
      data,
      include: { items: true },
    });
  }

  async findAll(
    userId: string,
    filters: FilterOrderDto,
  ): Promise<{ data: OrderWithItems[]; total: number }> {
    const where = this.buildWhere(userId, filters);
    const skip = (filters.page - 1) * filters.limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total };
  }

  findOne(id: string, userId: string): Promise<OrderWithItems | null> {
    return this.prisma.order.findFirst({
      where: { id, userId, deletedAt: null },
      include: { items: true },
    });
  }

  update(id: string, data: Prisma.OrderUpdateInput): Promise<OrderWithItems> {
    return this.prisma.order.update({
      where: { id },
      data,
      include: { items: true },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async generateOrderNumber(): Promise<string> {
    const total = await this.prisma.order.count();
    const year = new Date().getFullYear();
    const seq = String(total + 1).padStart(6, '0');
    return `ORD-${year}-${seq}`;
  }

  private buildWhere(
    userId: string,
    filters: FilterOrderDto,
  ): Prisma.OrderWhereInput {
    const { orderNumber, status, startDate, endDate } = filters;

    const createdAtFilter: Prisma.DateTimeFilter = {};
    if (startDate) {
      createdAtFilter.gte = new Date(startDate);
    }
    if (endDate) {
      createdAtFilter.lte = new Date(`${endDate.slice(0, 10)}T23:59:59.999Z`);
    }

    return {
      userId,
      deletedAt: null,
      ...(orderNumber && {
        orderNumber: { contains: orderNumber, mode: 'insensitive' },
      }),
      ...(status && { status }),
      ...(Object.keys(createdAtFilter).length > 0 && {
        createdAt: createdAtFilter,
      }),
    };
  }
}
