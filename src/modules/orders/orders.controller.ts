import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrderDto } from './dto/filter-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar pedido' })
  @ApiResponse({ status: 201, description: 'Pedido criado com sucesso' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar pedidos com filtros e paginação' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filters: FilterOrderDto,
  ) {
    return this.ordersService.findAll(user.id, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pedido por ID' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.ordersService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar pedido' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclusão lógica do pedido' })
  @ApiResponse({ status: 204, description: 'Pedido removido' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.ordersService.remove(id, user.id);
  }
}
