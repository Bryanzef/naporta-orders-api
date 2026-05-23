import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const repository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: repository },
      ],
    }).compile();

    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  it('findByEmail deve delegar ao repository', async () => {
    repository.findByEmail.mockResolvedValue({ id: 'user-1' });

    await expect(service.findByEmail('a@b.com')).resolves.toEqual({
      id: 'user-1',
    });
    expect(repository.findByEmail).toHaveBeenCalledWith('a@b.com');
  });

  it('findById deve delegar ao repository', async () => {
    repository.findById.mockResolvedValue({ id: 'user-1' });

    await expect(service.findById('user-1')).resolves.toEqual({
      id: 'user-1',
    });
    expect(repository.findById).toHaveBeenCalledWith('user-1');
  });

  it('create deve delegar ao repository', async () => {
    const input = {
      name: 'Maria',
      email: 'maria@naporta.com.br',
      passwordHash: 'hash',
    };
    repository.create.mockResolvedValue({ id: 'user-1', ...input });

    await expect(service.create(input)).resolves.toEqual({
      id: 'user-1',
      ...input,
    });
    expect(repository.create).toHaveBeenCalledWith(input);
  });
});
