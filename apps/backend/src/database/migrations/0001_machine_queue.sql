CREATE TABLE IF NOT EXISTS machine (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_called_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  failures INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS task_queue (
  id SERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL,
  result JSONB,
  status_code INT,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  machine_id INT REFERENCES machine(id)
);

ALTER TABLE lobby ADD COLUMN machine_id INT NOT NULL REFERENCES machine(id);

CREATE OR REPLACE FUNCTION deactivate_machine_on_failure()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.failures >= 10 THEN
    NEW.active = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_machine_failures
BEFORE UPDATE ON machine
FOR EACH ROW
WHEN (NEW.failures > OLD.failures)
EXECUTE FUNCTION deactivate_machine_on_failure();

CREATE OR REPLACE FUNCTION increment_machine_failures_on_task()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.machine_id IS NOT NULL THEN
    IF NEW.status = 'failed' THEN
      UPDATE machine
      SET failures = failures + 1
      WHERE id = NEW.machine_id;
    ELSIF NEW.status = 'completed' THEN
      UPDATE machine
      SET failures = 0
      WHERE id = NEW.machine_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_task_failures
AFTER UPDATE ON task_queue
FOR EACH ROW
WHEN (NEW.status IN ('failed', 'completed') AND NEW.machine_id IS NOT NULL)
EXECUTE FUNCTION increment_machine_failures_on_task();
