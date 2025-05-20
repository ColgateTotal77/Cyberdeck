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
    hp INT,
    cost INT,
    image_url TEXT DEFAULT NULL
);

INSERT INTO cards (id, name, description, attack, hp, cost) VALUES
(1, 'Iron Man', 'Fires repulsor blasts from his suit.', 7, 5, 4),
(2, 'Captain America', 'Blocks attacks with his vibranium shield.', 5, 8, 3),
(3, 'Thor', 'Strikes enemies with Mjolnir.', 9, 6, 5),
(4, 'Hulk', 'Smashes everything in sight.', 10, 7, 6),
(5, 'Black Widow', 'Fast and agile spy with deadly precision.', 6, 4, 3),
(6, 'Hawkeye', 'Shoots explosive arrows from a distance.', 5, 3, 2),
(7, 'Spider-Man', 'Uses webs to trap enemies and move quickly.', 6, 5, 3),
(8, 'Doctor Strange', 'Uses mystical spells to manipulate the battlefield.', 8, 4, 5),
(9, 'Black Panther', 'Uses claws and agility to fight fiercely.', 7, 6, 4),
(10, 'Scarlet Witch', 'Distorts reality and damages multiple enemies.', 9, 5, 5),
(11, 'Vision', 'Passes through enemies and fires energy beams.', 7, 7, 4),
(12, 'Ant-Man', 'Shrinks to dodge and surprise enemies.', 5, 5, 3),
(13, 'Wasp', 'Small, fast, and delivers precise stings.', 4, 4, 2),
(14, 'Falcon', 'Attacks from above using wings and tech.', 6, 4, 3),
(15, 'Winter Soldier', 'Expert fighter with a bionic arm.', 7, 5, 4),
(16, 'Captain Marvel', 'Unleashes cosmic energy blasts.', 9, 6, 5),
(17, 'Loki', 'Tricks and weakens enemies with illusions.', 5, 5, 3),
(18, 'Thanos', 'Overwhelming power. Can wipe out all at once.', 10, 10, 7),
(19, 'Gamora', 'Elite assassin trained by Thanos.', 7, 5, 4),
(20, 'Star-Lord', 'Quick shooter and unpredictable fighter.', 6, 4, 3);

-- DROP DATABASE Race01;
-- DROP USER 'snazarenko'@'localhost';