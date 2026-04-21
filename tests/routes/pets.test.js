const request = require('supertest');
const app = require('../../src/app');

jest.mock('../../src/models/pet');
const petModel = require('../../src/models/pet');

const samplePet = {
  petId: 'test-001',
  name: 'Buddy',
  species: 'Dog',
  breed: 'Golden Retriever',
  age: 3,
  price: 24999,
  description: 'A friendly dog',
  status: 'available',
};

afterEach(() => {
  jest.resetAllMocks();
});

describe('GET /api/pets', () => {
  it('returns 200 and empty array when no pets exist', async () => {
    petModel.getAll.mockResolvedValue([]);
    const res = await request(app).get('/api/pets');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns only pets matching status query parameter', async () => {
    const pets = [
      { petId: '1', name: 'Buddy', species: 'Dog', price: 8300, status: 'available' },
      { petId: '2', name: 'Whiskers', species: 'Cat', price: 4150, status: 'pending' },
      { petId: '3', name: 'Polly', species: 'Bird', price: 16600, status: 'adopted' },
    ];
    petModel.getAll.mockResolvedValue(pets);
    const res = await request(app).get('/api/pets?status=available');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([pets[0]]);
  });
});

describe('GET /api/pets/:id', () => {
  it('returns 200 and the pet when ID exists', async () => {
    petModel.getById.mockResolvedValue(samplePet);
    const res = await request(app).get('/api/pets/test-001');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(samplePet);
  });

  it('returns 404 when ID does not exist', async () => {
    petModel.getById.mockResolvedValue(null);
    const res = await request(app).get('/api/pets/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Pet not found' });
  });
});

describe('POST /api/pets', () => {
  it('returns 201 and the created pet when all fields provided', async () => {
    const input = { name: 'Buddy', species: 'Dog', breed: 'Golden Retriever', age: 3, price: 24999, description: 'A friendly dog' };
    const created = { petId: 'new-id', ...input };
    petModel.create.mockResolvedValue(created);

    const res = await request(app).post('/api/pets').send(input);
    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
  });

  it('returns 400 with missing fields listed when body is empty', async () => {
    const res = await request(app).post('/api/pets').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/);
    expect(res.body.error).toMatch(/species/);
    expect(res.body.error).toMatch(/price/);
  });

  it('defaults status to available when not provided', async () => {
    const input = { name: 'Buddy', species: 'Dog', price: 24999 };
    const created = { petId: 'new-id', ...input, status: 'available' };
    petModel.create.mockResolvedValue(created);

    await request(app).post('/api/pets').send(input);
    expect(petModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'available' })
    );
  });
});

describe('PUT /api/pets/:id', () => {
  it('returns 200 and updated pet when pet exists', async () => {
    const input = { name: 'Buddy Updated', species: 'Dog', breed: 'Labrador', age: 4, price: 28999, description: 'An updated friendly dog' };
    const updatedPet = { petId: 'test-001', ...input };
    petModel.updateById.mockResolvedValue(updatedPet);

    const res = await request(app).put('/api/pets/test-001').send(input);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedPet);
  });

  it('returns 404 when pet does not exist', async () => {
    const input = { name: 'Ghost', species: 'Cat', price: 8300 };
    petModel.updateById.mockResolvedValue(null);

    const res = await request(app).put('/api/pets/nonexistent').send(input);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Pet not found' });
  });

  it('returns 400 with missing fields listed when body is empty', async () => {
    const res = await request(app).put('/api/pets/test-001').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/);
    expect(res.body.error).toMatch(/species/);
    expect(res.body.error).toMatch(/price/);
  });
});

describe('PATCH /api/pets/:id/status', () => {
  it('returns 200 and updated pet when status is valid', async () => {
    const updatedPet = { ...samplePet, status: 'pending' };
    petModel.updateById.mockResolvedValue(updatedPet);

    const res = await request(app).patch('/api/pets/test-001/status').send({ status: 'pending' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedPet);
    expect(petModel.updateById).toHaveBeenCalledWith('test-001', { status: 'pending' });
  });

  it('returns 400 when status is invalid', async () => {
    const res = await request(app).patch('/api/pets/test-001/status').send({ status: 'invalid' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid status/);
  });

  it('returns 400 when no status provided', async () => {
    const res = await request(app).patch('/api/pets/test-001/status').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid status/);
  });

  it('returns 404 when pet does not exist', async () => {
    petModel.updateById.mockResolvedValue(null);

    const res = await request(app).patch('/api/pets/test-001/status').send({ status: 'adopted' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Pet not found' });
  });
});

describe('DELETE /api/pets/:id', () => {
  it('returns 200 when pet exists', async () => {
    petModel.deleteById.mockResolvedValue(samplePet);
    const res = await request(app).delete('/api/pets/test-001');
    expect(res.status).toBe(200);
  });

  it('returns 404 when pet does not exist', async () => {
    petModel.deleteById.mockResolvedValue(null);
    const res = await request(app).delete('/api/pets/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Pet not found' });
  });
});

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('CORS headers', () => {
  it('includes CORS headers on responses', async () => {
    petModel.getAll.mockResolvedValue([]);
    const res = await request(app).get('/api/pets');
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});
