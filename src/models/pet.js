const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const clientConfig = {};
if (process.env.DYNAMODB_ENDPOINT) {
  clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
  clientConfig.region = process.env.AWS_REGION || 'us-east-1';
  clientConfig.credentials = { accessKeyId: 'local', secretAccessKey: 'local' };
}
const client = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'Pets';

async function getAll() {
  const result = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
  return result.Items || [];
}

async function getBySpecies(species) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'species-index',
    KeyConditionExpression: '#s = :species',
    ExpressionAttributeNames: { '#s': 'species' },
    ExpressionAttributeValues: { ':species': species },
  }));
  return result.Items || [];
}

async function getById(id) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { petId: id },
  }));
  return result.Item || null;
}

async function create(data) {
  const pet = {
    petId: uuidv4(),
    ...data,
  };
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: pet,
  }));
  return pet;
}

async function deleteById(id) {
  const existing = await getById(id);
  if (!existing) {
    return null;
  }
  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { petId: id },
  }));
  return existing;
}

module.exports = { getAll, getBySpecies, getById, create, deleteById };
