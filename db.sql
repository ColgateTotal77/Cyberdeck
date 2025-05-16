CREATE DATABASE IF NOT EXISTS Race01;
CREATE USER IF NOT EXISTS 'snazarenko'@'localhost' IDENTIFIED BY 'securepass';
GRANT ALL PRIVILEGES ON Race01.* TO 'snazarenko'@'localhost';

-- DROP DATABASE Race01;
-- DROP USER 'snazarenko'@'localhost';

USE Race01;

CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rating INT NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS MatchHistory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player1_id INT NOT NULL,
    player2_id INT NOT NULL,
    player1_rating INT NOT NULL,
    player2_rating INT NOT NULL,
    winner_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    
    FOREIGN KEY (player1_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (player2_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES Users(id) ON DELETE CASCADE
);
