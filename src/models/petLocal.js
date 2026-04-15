const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'pets.json');

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    // Seed with sample data on first read
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const seed = [
      { petId: 'seed-001', name: 'Buddy', species: 'Dog', breed: 'Golden Retriever', age: 3, price: 299.99, description: 'A friendly golden retriever' },
      { petId: 'seed-002', name: 'Whiskers', species: 'Cat', breed: 'Siamese', age: 2, price: 149.99, description: 'A curious siamese cat' },
      { petId: 'seed-003', name: 'Polly', species: 'Bird', breed: 'Macaw', age: 5, price: 499.99, description: 'A colorful macaw' },
      { petId: 'seed-004', name: 'Shelly', species: 'Reptile', breed: 'Red-Eared Slider', age: 4, price: 79.99, description: 'A calm turtle' },
      { petId: 'seed-005', name: 'Nemo', species: 'Fish', breed: 'Clownfish', age: 1, price: 29.99, description: 'A bright clownfish' },
    ];
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2));
    return seed;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDb(data) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

async function getAll() {
  return readDb();
}

async function getBySpecies(species) {
  const pets = readDb();
  return pets.filter((p) => p.species === species);
}

async function getById(id) {
  const pets = readDb();
  return pets.find((p) => p.petId === id) || null;
}

async function create(data) {
  const pets = readDb();
  const pet = { petId: crypto.randomUUID(), ...data };
  pets.push(pet);
  writeDb(pets);
  return pet;
}

async function deleteById(id) {
  const pets = readDb();
  const index = pets.findIndex((p) => p.petId === id);
  if (index === -1) return null;
  const [deleted] = pets.splice(index, 1);
  writeDb(pets);
  return deleted;
}

module.exports = { getAll, getBySpecies, getById, create, deleteById };
