const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:CKKqawqsugOrHqQbILktYvoarWfPoCWK@thomas.proxy.rlwy.net:45820/railway',
});

async function run() {
  await client.connect();
  try {
    const res = await client.query("SELECT * FROM usuarios WHERE email = 'erik@admin.com';");
    console.log('USER ERIK:', res.rows);
  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}

run();
