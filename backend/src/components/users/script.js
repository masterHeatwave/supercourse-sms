// delete_koukis_collections.js
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017'; // Local MongoDB
const dbName = 'supercourse-sms'; // CHANGE THIS TO YOUR DB NAME

async function deleteKoukisCollections() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();

    const koukisCollections = collections.map((col) => col.name).filter((name) => name.startsWith('koukis_'));

    if (koukisCollections.length === 0) {
      console.log('No collections starting with "koukis_" found.');
      return;
    }

    console.log('Found collections to delete:');
    koukisCollections.forEach((name) => console.log(`  - ${name}`));

    // Delete each collection
    for (const name of koukisCollections) {
      await db.collection(name).drop();
      console.log(`Deleted: ${name}`);
    }

    console.log(`\nAll ${koukisCollections.length} koukis_* collections deleted!`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

deleteKoukisCollections();
