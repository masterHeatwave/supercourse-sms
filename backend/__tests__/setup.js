const MemoryDatabaseServer = require('./MemoryDatabaseServer');

module.exports = async () => {
  await MemoryDatabaseServer.start();
};
