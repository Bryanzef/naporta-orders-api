import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'Caderno universitário 10 matérias' })
  @IsString()
  @MaxLength(255)
  description!: string;

  @ApiProperty({ example: 29.9 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Preço deve ter no máximo 2 casas decimais' },
  )
  @Min(0.01, { message: 'Preço deve ser maior que zero' })
  price!: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity!: number;
}

const CPF_OR_CNPJ_REGEX =
  /^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/;
const UF_REGEX = /^[A-Z]{2}$/;
const ZIP_CODE_REGEX = /^\d{5}-\d{3}$/;

export class CreateOrderDto {
  @ApiProperty({ example: '2026-06-30T00:00:00.000Z' })
  @IsDateString()
  deliveryDate!: string;

  @ApiProperty({ example: 'Maria das Graças Silva' })
  @IsString()
  @MaxLength(180)
  customerName!: string;

  @ApiProperty({
    example: '123.456.789-00',
    description: 'CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)',
  })
  @IsString()
  @Matches(CPF_OR_CNPJ_REGEX, {
    message: 'Documento inválido — informe um CPF ou CNPJ formatado',
  })
  customerDocument!: string;

  @ApiProperty({ example: 'Rua das Flores' })
  @IsString()
  @MaxLength(180)
  addressStreet!: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @MaxLength(20)
  addressNumber!: string;

  @ApiProperty({ required: false, example: 'Apto 42' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  addressComplement?: string;

  @ApiProperty({ example: 'Centro' })
  @IsString()
  @MaxLength(120)
  addressDistrict!: string;

  @ApiProperty({ example: 'Itajaí' })
  @IsString()
  @MaxLength(120)
  addressCity!: string;

  @ApiProperty({ example: 'SC' })
  @IsString()
  @Matches(UF_REGEX, {
    message: 'Estado deve ser a sigla UF com 2 letras maiúsculas',
  })
  addressState!: string;

  @ApiProperty({ example: '88301-100' })
  @IsString()
  @Matches(ZIP_CODE_REGEX, {
    message: 'CEP inválido — formato esperado: 00000-000',
  })
  addressZipCode!: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Um pedido deve ter ao menos 1 item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
