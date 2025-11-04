const { MongoMemoryServer } = require('mongodb-memory-server');

class MemoryDatabaseServer {
  constructor() {
    this.mongod = null;
  }

  async ensureInstance() {
    if (!this.mongod) {
      this.mongod = await MongoMemoryServer.create({
        binary: {
          version: '7.0.14',
        },
      });
    }
  }

  async start() {
    await this.ensureInstance();
    if (!this.mongod.instanceInfo) {
      await this.mongod.start();
    }
  }

  async stop() {
    if (this.mongod) {
      await this.mongod.stop();
    }
  }

  async getConnectionString() {
    await this.ensureInstance();
    return this.mongod.getUri();
  }
}

module.exports = new MemoryDatabaseServer();
