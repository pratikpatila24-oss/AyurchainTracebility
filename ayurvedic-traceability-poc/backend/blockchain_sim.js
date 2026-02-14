const crypto = require('crypto');

class Chain {
  constructor() {
    this.chain = [];
    this.init();
  }

  init() {
    const genesis = this._makeRecord({ type: 'GENESIS', data: 'genesis' }, '0');
    this.chain.push(genesis);
  }

  _makeRecord(payload, prevHash) {
    const timestamp = new Date().toISOString();
    const payloadString = JSON.stringify(payload);
    const hash = crypto.createHash('sha256')
      .update(prevHash + timestamp + payloadString)
      .digest('hex');

    return { hash, prevHash, timestamp, payload };
  }

  addRecord(payload) {
    const prevHash = this.chain[this.chain.length - 1].hash;
    const rec = this._makeRecord(payload, prevHash);
    this.chain.push(rec);
    return rec;
  }

  getChain() { return this.chain; }

  // fetch events for a given batchId
  queryByBatch(batchId) {
    return this.chain
      .map(r => r.payload)
      .filter(p => p && p.data && p.data.batchId === batchId);
  }
}

module.exports = new Chain();
