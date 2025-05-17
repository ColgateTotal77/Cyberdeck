CREATE DATABASE IF NOT EXISTS Race01;
CREATE USER IF NOT EXISTS 'snazarenko'@'localhost' IDENTIFIED BY 'securepass';
GRANT ALL PRIVILEGES ON Race01.* TO 'snazarenko'@'localhost';

USE Race01;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rating INT NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player1_id INT NOT NULL,
    player2_id INT NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME DEFAULT NULL,
    winner_id INT DEFAULT NULL,

    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id),
    FOREIGN KEY (winner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS cards (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    description TEXT,
    attack INT,
    defense INT,
    cost INT,
    image_url TEXT
);

-- DROP DATABASE Race01;
-- DROP USER 'snazarenko'@'localhost';