const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'chain_data.json');

class Chain {
  constructor() {
    this.chain = [];
    this.init();
  }

  init() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        this.chain = JSON.parse(data);
        console.log('Blockchain loaded from database.');
      } catch (err) {
        console.error('Error loading database:', err);
        // Fallback to genesis if corrupt
        this._createGenesis();
      }
    } else {
      this._createGenesis();
    }
  }

  _createGenesis() {
    const genesis = this._makeRecord({ type: 'GENESIS', data: 'genesis' }, '0');
    this.chain.push(genesis);
    this._save();
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
    this._save();
    return rec;
  }

  _save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.chain, null, 2));
    } catch (err) {
      console.error('Error saving to database:', err);
    }
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
