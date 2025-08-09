// clean-database.js
// This script cleans the requests array in database.json:
// - Removes duplicates (same id and userInfo)
// - Ensures unique ids
// - Replaces null imageUrl with a placeholder

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.json');
const PLACEHOLDER = '/uploads/placeholder.png';

function cleanRequests(requests) {
  const seen = new Set();
  let nextId = 1;
  return requests.filter(req => {
    const key = req.userInfo + '|' + req.imageUrl;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(req => ({
    ...req,
    id: nextId++,
    imageUrl: req.imageUrl == null ? PLACEHOLDER : req.imageUrl
  }));
}

function main() {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  db.requests = cleanRequests(db.requests);
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log('database.json cleaned successfully!');
}

main();
