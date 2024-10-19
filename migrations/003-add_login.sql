CREATE TABLE Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username STRING NOT NULL,
    password STRING NOT NULL
);

CREATE TABLE Sessions (
    token STRING NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);


INSERT INTO Users (id, username, password) VALUES (0, 'admin', '$2a$12$0RA.XoWNHwHAKlhUS81hpuxflb6LXtTXQOZLNL3TaaUZ74fQqMkdm');
