-- Bill splitter schema.
-- Money is always stored as whole cents (INTEGER). Never decimals.

CREATE TABLE homes (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CONSTRAINT homes_name_not_blank CHECK (length(trim(name)) > 0)
);

-- `seq` is an auto-incrementing number, so it records the order members were
-- added. It is race-safe: the database hands out the numbers, not our code.
CREATE TABLE members (
  seq        INTEGER PRIMARY KEY AUTOINCREMENT,
  id         TEXT NOT NULL,
  home_id    TEXT NOT NULL,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CONSTRAINT members_id_unique UNIQUE (id),
  CONSTRAINT members_home_fk FOREIGN KEY (home_id) REFERENCES homes (id),
  CONSTRAINT members_name_not_blank CHECK (length(trim(name)) > 0)
);
CREATE INDEX members_home_idx ON members (home_id, seq);

CREATE TABLE bills (
  seq         INTEGER PRIMARY KEY AUTOINCREMENT,
  id          TEXT NOT NULL,
  home_id     TEXT NOT NULL,
  title       TEXT NOT NULL,
  total_cents INTEGER NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CONSTRAINT bills_id_unique UNIQUE (id),
  CONSTRAINT bills_home_fk FOREIGN KEY (home_id) REFERENCES homes (id),
  CONSTRAINT bills_title_not_blank CHECK (length(trim(title)) > 0),
  CONSTRAINT bills_total_positive_integer CHECK (typeof(total_cents) = 'integer' AND total_cents > 0)
);
CREATE INDEX bills_home_idx ON bills (home_id, seq);

-- One row per member per bill. The idempotency key of the payment is stored on
-- the share itself: paid_at and payment_key are set together, in one UPDATE.
CREATE TABLE shares (
  seq         INTEGER PRIMARY KEY AUTOINCREMENT,
  id          TEXT NOT NULL,
  bill_id     TEXT NOT NULL,
  member_id   TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  paid_at     TEXT,
  payment_key TEXT,
  CONSTRAINT shares_id_unique UNIQUE (id),
  CONSTRAINT shares_bill_fk FOREIGN KEY (bill_id) REFERENCES bills (id),
  CONSTRAINT shares_member_fk FOREIGN KEY (member_id) REFERENCES members (id),
  CONSTRAINT shares_one_per_member_per_bill UNIQUE (bill_id, member_id),
  CONSTRAINT shares_amount_non_negative_integer CHECK (typeof(amount_cents) = 'integer' AND amount_cents >= 0),
  CONSTRAINT shares_paid_fields_together CHECK ((paid_at IS NULL) = (payment_key IS NULL))
);
CREATE INDEX shares_bill_idx ON shares (bill_id, seq);
CREATE INDEX shares_member_idx ON shares (member_id);