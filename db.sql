CREATE DATABASE IF NOT EXISTS Race01;
CREATE USER IF NOT EXISTS 'snazarenko'@'localhost' IDENTIFIED BY 'securepass';
GRANT ALL PRIVILEGES ON Race01.* TO 'snazarenko'@'localhost';

USE Race01;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_path VARCHAR(255) DEFAULT "/avatars/default.jpeg",
    rating INT NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player1_id INT NOT NULL,
    player2_id INT NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME DEFAULT NULL,
    winner_id INT DEFAULT NULL,
    rating_for_winner INT DEFAULT NULL,
    rating_for_loser INT DEFAULT NULL,

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
    card_img_path VARCHAR(255)
);

INSERT INTO cards (id, name, description, attack, hp, cost, card_img_path) VALUES
(1, 'V', 'Fires repulsor blasts from his suit.', 7, 5, 4, "/image/cards/V.png"),
(2, 'Johnny Silverhand', 'Blocks attacks with his vibranium shield.', 5, 8, 3, "/image/cards/Johnny_Silverhand.png"),
(3, 'Panam Palmer', 'Strikes enemies with Mjolnir.', 9, 6, 5, "/image/cards/Panam_Palmer.png"),
(4, 'Viktor Vector', 'Smashes everything in sight.', 10, 7, 6, "/image/cards/Viktor_Vector.png"),
(5, 'Judy Alvarez', 'Fast and agile spy with deadly precision.', 6, 4, 3, "/image/cards/Judy_Alvarez.png"),
(6, 'Jackie Welles', 'Shoots explosive arrows from a distance.', 5, 3, 2, "/image/cards/Jackie_Welles.png"),
(7, 'Takemura Goro', 'Uses webs to trap enemies and move quickly.', 6, 5, 3, "/image/cards/Takemura_Goro.png"),
(8, 'Adam Smasher', 'Uses mystical spells to manipulate the battlefield.', 8, 4, 5, "/image/cards/Adam_Smasher.png"),
(9, 'Dexter DeShawn', 'Uses claws and agility to fight fiercely.', 7, 6, 4, "/image/cards/Dexter_DeShawn.png"),
(10, 'River Ward', 'Distorts reality and damages multiple enemies.', 9, 5, 5, "/image/cards/River_Ward.png"),
(11, 'Evelyn Parker', 'Passes through enemies and fires energy beams.', 7, 7, 4, "/image/cards/Evelyn_Parker.png"),
(12, 'Yorinobu Arasaka', 'Shrinks to dodge and surprise enemies.', 5, 5, 3, "/image/cards/Yorinobu_Arasaka.png"),
(13, 'Hanako Arasaka', 'Small, fast, and delivers precise stings.', 4, 4, 2, "/image/cards/Hanako_Arasaka.png"),
(14, 'Placide', 'Attacks from above using wings and tech.', 6, 4, 3, "/image/cards/Placide.png"),
(15, 'Maman Brigitte', 'Expert fighter with a bionic arm.', 7, 5, 4, "/image/cards/Maman_Brigitte.png"),
(16, 'Kerry Eurodyne', 'Unleashes cosmic energy blasts.', 9, 6, 5, "/image/cards/Kerry_Eurodyne.png"),
(17, 'Rogue Amendiares', 'Tricks and weakens enemies with illusions.', 5, 5, 3, "/image/cards/Rogue_Amendiares.png"),
(18, 'Delamain', 'Overwhelming power. Can wipe out all at once.', 10, 10, 7, "/image/cards/Delamain.png"),
(19, 'Meredith Stout', 'Elite assassin trained by Thanos.', 7, 5, 4, "/image/cards/Meredith_Stout.png"),
(20, 'T-Bug', 'Quick shooter and unpredictable fighter.', 6, 4, 3, "/image/cards/T-Bug.png");

-- DROP DATABASE Race01;
-- DROP USER 'snazarenko'@'localhost';