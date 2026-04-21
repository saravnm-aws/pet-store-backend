const { DynamoDBClient, DescribeTableCommand, CreateTableCommand, waitUntilTableExists } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchWriteCommand, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.TABLE_NAME || 'Pets';
const clientConfig = {};
if (process.env.DYNAMODB_ENDPOINT) {
  clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
  clientConfig.region = process.env.AWS_REGION || 'us-east-1';
  clientConfig.credentials = { accessKeyId: 'local', secretAccessKey: 'local' };
}
const client = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(client);

const SEED_PETS = [
  { petId: 'seed-001', name: 'Buddy', species: 'Dog', breed: 'Golden Retriever', age: 3, price: 299.99, status: 'available' },
  { petId: 'seed-002', name: 'Whiskers', species: 'Cat', breed: 'Siamese', age: 2, price: 149.99, status: 'available' },
  { petId: 'seed-003', name: 'Polly', species: 'Bird', breed: 'Macaw', age: 5, price: 499.99, status: 'available' },
  { petId: 'seed-004', name: 'Shelly', species: 'Reptile', breed: 'Red-Eared Slider', age: 4, price: 79.99, status: 'available' },
  { petId: 'seed-005', name: 'Nemo', species: 'Fish', breed: 'Clownfish', age: 1, price: 29.99, status: 'available' },
];

async function ensureTableExists() {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`Table "${TABLE_NAME}" already exists.`);
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      console.log(`Table "${TABLE_NAME}" not found. Creating...`);
      await client.send(new CreateTableCommand({
        TableName: TABLE_NAME,
        KeySchema: [{ AttributeName: 'petId', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'petId', AttributeType: 'S' }],
        BillingMode: 'PAY_PER_REQUEST',
      }));
      console.log('Waiting for table to become ACTIVE...');
      await waitUntilTableExists({ client, maxWaitTime: 120 }, { TableName: TABLE_NAME });
      console.log(`Table "${TABLE_NAME}" is now ACTIVE.`);
    } else {
      throw err;
    }
  }
}

async function getExistingPetIds(petIds) {
  const result = await docClient.send(new BatchGetCommand({
    RequestItems: {
      [TABLE_NAME]: {
        Keys: petIds.map((id) => ({ petId: id })),
        ProjectionExpression: 'petId',
      },
    },
  }));
  const items = (result.Responses && result.Responses[TABLE_NAME]) || [];
  return new Set(items.map((item) => item.petId));
}

async function insertSeedData() {
  const allIds = SEED_PETS.map((p) => p.petId);
  const existingIds = await getExistingPetIds(allIds);

  const newPets = SEED_PETS.filter((p) => !existingIds.has(p.petId));

  if (newPets.length === 0) {
    console.log('All seed records already exist. Nothing to insert.');
    return;
  }

  console.log(`Inserting ${newPets.length} new seed record(s)...`);

  await docClient.send(new BatchWriteCommand({
    RequestItems: {
      [TABLE_NAME]: newPets.map((pet) => ({
        PutRequest: { Item: pet },
      })),
    },
  }));

  console.log('Seed data inserted successfully.');
}

async function main() {
  try {
    await ensureTableExists();
    await insertSeedData();
    console.log('Seed script completed.');
  } catch (err) {
    console.error('Seed script failed:', err.message);
    process.exit(1);
  }
}

main();

module.exports = { ensureTableExists, insertSeedData, SEED_PETS, TABLE_NAME };
