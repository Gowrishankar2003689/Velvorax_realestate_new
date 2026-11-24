const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  multipleStatements: true
};

async function setup() {
  const connection = await mysql.createConnection(config);

  const schemaSql = fs.readFileSync(path.join(__dirname, 'sql', 'realestate.sql'), 'utf8');
  await connection.query(schemaSql);

  await connection.changeUser({ database: 'velvorax_realestate' });
  const seedSql = fs.readFileSync(path.join(__dirname, 'sql', 'realestate_seed.sql'), 'utf8');
  await connection.query(seedSql);

  const [tableRows] = await connection.query(
    `SELECT COUNT(*) AS table_count
       FROM information_schema.tables
      WHERE table_schema = 'velvorax_realestate'
        AND table_name LIKE 're_%'`
  );

  const [countRows] = await connection.query(
    `SELECT
       (SELECT COUNT(*) FROM re_companies) AS companies,
       (SELECT COUNT(*) FROM re_projects) AS projects,
       (SELECT COUNT(*) FROM re_properties) AS properties,
       (SELECT COUNT(*) FROM re_leads) AS leads,
       (SELECT COUNT(*) FROM re_bookings) AS bookings,
       (SELECT COUNT(*) FROM re_integrations) AS integrations`
  );

  console.log('MySQL real-estate database created: velvorax_realestate');
  console.log(`Tables created: ${tableRows[0].table_count}`);
  console.log(`Seed counts: ${JSON.stringify(countRows[0])}`);
  await connection.end();
}

setup().catch((err) => {
  console.error('MySQL real-estate setup failed:', err.message);
  process.exit(1);
});
