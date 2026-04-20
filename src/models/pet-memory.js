const { v4: uuidv4 } = require('uuid');

// In-memory store with seed data
const pets = new Map([
  ['seed-001', { petId: 'seed-001', name: 'Buddy', species: 'Dog', breed: 'Golden Retriever', age: 3, price: 299.99, description: 'A friendly golden retriever who loves fetch' }],
  ['seed-002', { petId: 'seed-002', name: 'Whiskers', species: 'Cat', breed: 'Siamese', age: 2, price: 149.99, description: 'A curious and playful Siamese cat' }],
  ['seed-003', { petId: 'seed-003', name: 'Polly', species: 'Bird', breed: 'Macaw', age: 5, price: 499.99, description: 'A colorful macaw that can say hello' }],
  ['seed-004', { petId: 'seed-004', name: 'Shelly', species: 'Reptile', breed: 'Red-Eared Slider', age: 4, price: 79.99, description: 'A calm and easy-to-care-for turtle' }],
  ['seed-005', { petId: 'seed-005', name: 'Nemo', species: 'Fish', breed: 'Clownfish', age: 1, price: 29.99, description: 'A vibrant clownfish for your aquarium' }],
]);

async function getAll() {
  return Array.from(pets.values());
}

async function getById(id) {
  return pets.get(id) || null;
}

async function create(data) {
  const pet = { petId: uuidv4(), ...data };
  pets.set(pet.petId, pet);
  return pet;
}

async function deleteById(id) {
  const existing = pets.get(id);
  if (!existing) return null;
  pets.delete(id);
  return existing;
}

async function updateById(id, data) {
  const existing = pets.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...data, petId: id };
  pets.set(id, updated);
  return updated;
}

module.exports = { getAll, getById, create, deleteById, updateById };
