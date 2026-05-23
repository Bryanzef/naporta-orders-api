import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'maria@naporta.com.br' })
  @IsEmail({}, { message: 'E-mail inválido' })
  @MaxLength(180)
  email!: string;

  @ApiProperty({ example: 'senha123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password!: string;
}
