import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersRepository } from './users.repository';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get(UsersRepository);
    jest.clearAllMocks();
  });

  it('findByEmail deve consultar usuário por e-mail', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

    await expect(repository.findByEmail('a@b.com')).resolves.toEqual({
      id: 'user-1',
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'a@b.com' },
    });
  });

  it('findById deve consultar usuário por id', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

    await expect(repository.findById('user-1')).resolves.toEqual({
      id: 'user-1',
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
  });

  it('create deve persistir novo usuário', async () => {
    const input = {
      name: 'Maria',
      email: 'maria@naporta.com.br',
      passwordHash: 'hash',
    };
    prisma.user.create.mockResolvedValue({ id: 'user-1', ...input });

    await expect(repository.create(input)).resolves.toEqual({
      id: 'user-1',
      ...input,
    });
    expect(prisma.user.create).toHaveBeenCalledWith({ data: input });
  });
});
