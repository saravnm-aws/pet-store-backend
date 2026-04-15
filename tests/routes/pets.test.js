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
  price: 299.99,
  description: 'A friendly dog',
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
    const input = { name: 'Buddy', species: 'Dog', breed: 'Golden Retriever', age: 3, price: 299.99, description: 'A friendly dog' };
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

describe('GET /api/pets?species=...', () => {
  it('returns 200 and filtered pets when species is provided', async () => {
    petModel.getBySpecies.mockResolvedValue([samplePet]);
    const res = await request(app).get('/api/pets?species=Dog');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([samplePet]);
    expect(petModel.getBySpecies).toHaveBeenCalledWith('Dog');
    expect(petModel.getAll).not.toHaveBeenCalled();
  });

  it('returns 200 and empty array when species has no matches', async () => {
    petModel.getBySpecies.mockResolvedValue([]);
    const res = await request(app).get('/api/pets?species=Bird');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('calls getAll when no species param is provided', async () => {
    petModel.getAll.mockResolvedValue([samplePet]);
    const res = await request(app).get('/api/pets');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([samplePet]);
    expect(petModel.getAll).toHaveBeenCalled();
  });

  it('returns 400 for invalid species parameter with special characters', async () => {
    const res = await request(app).get('/api/pets?species=Dog%3BDROP');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid species/);
  });

  it('returns 400 for species parameter with spaces', async () => {
    const res = await request(app).get('/api/pets?species=Golden%20Dog');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid species/);
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
