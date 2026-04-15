const express = require('express');
const router = express.Router();
const modelPath = process.env.USE_LOCAL_DB === 'true'
  ? '../models/petLocal'
  : process.env.USE_MEMORY_DB === 'true'
    ? '../models/pet-memory'
    : '../models/pet';
const { getAll, getBySpecies, getById, create, deleteById } = require(modelPath);

// GET / — List all pets (optionally filtered by species)
router.get('/', async (req, res, next) => {
  try {
    const { species } = req.query;
    if (species) {
      if (typeof species !== 'string' || !/^[A-Za-z]+$/.test(species)) {
        return res.status(400).json({ error: 'Invalid species parameter. Only alphabetic characters are allowed.' });
      }
      const pets = await getBySpecies(species);
      return res.status(200).json(pets);
    }
    const pets = await getAll();
    res.status(200).json(pets);
  } catch (err) {
    next(err);
  }
});

// GET /:id — Get pet by ID
router.get('/:id', async (req, res, next) => {
  try {
    const pet = await getById(req.params.id);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    res.status(200).json(pet);
  } catch (err) {
    next(err);
  }
});

// POST / — Create a new pet
router.post('/', async (req, res, next) => {
  try {
    const { name, species, price } = req.body;
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!species) missingFields.push('species');
    if (price === undefined || price === null) missingFields.push('price');

    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    const pet = await create(req.body);
    res.status(201).json(pet);
  } catch (err) {
    next(err);
  }
});

// DELETE /:id — Delete a pet
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await deleteById(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
