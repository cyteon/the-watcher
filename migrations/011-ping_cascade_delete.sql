ALTER TABLE Pings RENAME TO Pings_old;

CREATE TABLE Pings (
    id INT NOT NULL,
    code INT NOT NULL,
    status STRING NOT NULL,
    ping INT NOT NULL DEFAULT 0,
    time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES Monitors(id) ON DELETE CASCADE
);

INSERT INTO Pings (id, code, status, ping, time)
SELECT id, code, status, ping, time
  FROM Pings_old;

DROP TABLE Pings_old;

PRAGMA foreign_keys = ON;