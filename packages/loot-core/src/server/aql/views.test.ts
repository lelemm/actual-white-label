// @ts-strict-ignore
import * as db from '../db';

import { makeViews } from './views';

beforeEach(global.emptyDatabase());

// White-label version: Updated to use generic entity name instead of transactions
const schema = {
  items: {
    id: { type: 'id' },
    amount: { type: 'integer' },
    transfer_id: { type: 'integer' },
  },
};

const schemaConfig = {
  views: {
    items: {
      fields: {
        amount: 'a_mo_unt',
      },

      v_items1: internalFields => {
        const fields = internalFields({
          transfer_id: 'CASE WHEN amount < 4 THEN null ELSE transfer_id END',
        });

        return `SELECT ${fields} FROM items`;
      },

      v_items2: (_, publicFields) => {
        const fields = publicFields({
          transfer_id: 'COERCE(transfer_id, "foo")',
        });

        return `SELECT ${fields} FROM v_items1`;
      },
    },
  },
};

describe('schema views', () => {
  test('generates views with all the right fields', () => {
    const str = makeViews(schema, schemaConfig);
    expect(str).toMatch('DROP VIEW IF EXISTS v_items1;');
    expect(str).toMatch(
      'CREATE VIEW v_items1 AS SELECT _.id, _.a_mo_unt AS amount, CASE WHEN amount < 4 THEN null ELSE transfer_id END AS transfer_id FROM items;',
    );
    expect(str).toMatch('DROP VIEW IF EXISTS v_items2;');
    expect(str).toMatch(
      'CREATE VIEW v_items2 AS SELECT _.id, _.amount, COERCE(transfer_id, "foo") AS transfer_id FROM v_items1;',
    );

    db.execQuery('DROP TABLE IF EXISTS items');
    db.execQuery(
      'CREATE TABLE items (id TEXT PRIMARY KEY, a_mo_unt INTEGER, transfer_id TEXT)',
    );

    // Make sure the string is valid SQL
    db.execQuery(str);
  });
});
