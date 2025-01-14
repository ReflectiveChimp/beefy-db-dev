const { Pool } = require('pg');
const pgcs = require('pg-connection-string');
const pgf = require('pg-format');

const { DATABASE_URL } = require('../utils/cfg');
const { log } = require('../utils/log');

let pool;

async function connect ()  {
  log.info(`connecting database`);

  // FIXME: self signed certs workaround
  // https://node-postgres.com/announcements#2020-02-25
  const config = pgcs.parse(DATABASE_URL);
  config.ssl = { rejectUnauthorized: false };
  pool = new Pool(config);
  
  log.info(`database connected`);
}

// FIXME: use a migrations system? (or just IPFS db??)
async function migrate () {
  await pool.query(
  `CREATE TABLE IF NOT EXISTS apys (
    id SERIAL,
    t BIGINT NOT NULL,
    name VARCHAR(64) NOT NULL, 
    val DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (id));
  
  CREATE TABLE IF NOT EXISTS prices (
    id SERIAL,
    t BIGINT NOT NULL,
    name VARCHAR(64) NOT NULL, 
    val DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (id));
  
  CREATE TABLE IF NOT EXISTS tvls (
    id SERIAL,
    t BIGINT NOT NULL,
    name VARCHAR(64) NOT NULL, 
    val DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (id));

  CREATE INDEX IF NOT EXISTS apys_t_idx ON apys (t);
  CREATE INDEX IF NOT EXISTS prices_t_idx ON prices (t);
  CREATE INDEX IF NOT EXISTS tvls_t_idx ON tvls (t);

  CREATE INDEX IF NOT EXISTS apys_name_idx ON apys (name);
  CREATE INDEX IF NOT EXISTS prices_name_idx ON prices (name);
  CREATE INDEX IF NOT EXISTS tvls_name_idx ON tvls (name);
  `
  )
}

async function insert (table, values) {
  log.info(`insert into ${table}`);  
  const insert = pgf('INSERT INTO %I (t, name, val) VALUES %L', table, values);
  return pool.query(insert);
}

async function query ({ table, filter}) {
  log.debug(`query ${table}`);

  // FIXME: remove name once we implement this on the client side 
  const q = [pgf('SELECT date_trunc(%L, to_timestamp(t)) as ts, name, MAX(val) as v FROM %I', filter.period, table)];

  // TODO: use knex? or a proper minimalist query builder
  if (filter && Object.keys(filter).length > 0) {
    q.push('WHERE');

    if (filter.name) {
      q.push(pgf('name = %L', filter.name));
    }

    if (filter.name && filter.from) {
      q.push('AND');
    }

    if (filter.from || filter.to) {
      q.push(pgf('t BETWEEN %L AND %L', filter.from, filter.to));
    }

    if (filter.period) {
      q.push(pgf('GROUP BY ts, name'));
    }

    const order = onlyOrder(filter.order, 'ASC');
    const limit = onlyInteger(filter.limit, 30);
    q.push(pgf('ORDER BY ts %s', order));
    q.push(pgf('LIMIT %s', limit));
  }

  log.debug(q.join(' '));

  return pool.query(q.join(' '));
}

function onlyOrder(order, defaultOrder = 'ASC') {
  order = (order || '').toString().toUpperCase();
  if (order === 'ASC' || order === 'DESC') {
    return order;
  }

  return defaultOrder;
}

function onlyInteger(value, defaultValue = 0) {
  if (typeof value !== 'number') {
    value = parseInt(value, 10);
  }

  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return defaultValue;
  }

  return Math.floor(value);
}

module.exports = {
  connect,
  migrate,
  insert,
  query,
}