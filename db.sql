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
(1, 'V', 'The legendary mercenary of Night City. Balanced fighter with Kereznikov reflexes.', 6, 8, 4, "/image/cards/V.png"),
(2, 'Johnny Silverhand', 'Rockerboy terrorist with a vendetta against corporations. High damage, fragile.', 9, 4, 5, "/image/cards/Johnny_Silverhand.png"),
(3, 'Panam Palmer', 'Nomad warrior with heavy weapons expertise. Strong attacker with decent survivability.', 7, 6, 4, "/image/cards/Panam_Palmer.png"),
(4, 'Viktor Vector', 'Underground ripperdoc. Low combat stats but provides healing abilities.', 2, 12, 3, "/image/cards/Viktor_Vector.png"),
(5, 'Judy Alvarez', 'Braindance technician. Moderate stats with tech support capabilities.', 4, 7, 3, "/image/cards/Judy_Alvarez.png"),
(6, 'Jackie Welles', 'Reliable partner and street kid. Well-rounded stats for early game.', 5, 9, 3, "/image/cards/Jackie_Welles.png"),
(7, 'Takemura Goro', 'Former Arasaka bodyguard. High defense with samurai discipline.', 5, 11, 4, "/image/cards/Takemura_Goro.png"),
(8, 'Adam Smasher', 'Full-body cyborg killing machine. Highest attack and health, very expensive.', 12, 15, 8, "/image/cards/Adam_Smasher.png"),
(9, 'Dexter DeShawn', 'Heavyweight fixer with connections. Moderate combat, high cost for utility.', 6, 10, 5, "/image/cards/Dexter_DeShawn.png"),
(10, 'River Ward', 'NCPD detective with investigation skills. Balanced defensive fighter.', 5, 8, 3, "/image/cards/River_Ward.png"),
(11, 'Evelyn Parker', 'Sophisticated doll with secrets. Low combat but strategic value.', 3, 5, 2, "/image/cards/Evelyn_Parker.png"),
(12, 'Yorinobu Arasaka', 'Corporate heir with resources. High cost, strong late-game card.', 8, 9, 6, "/image/cards/Yorinobu_Arasaka.png"),
(13, 'Hanako Arasaka', 'Arasaka princess with subtle power. Moderate stats, corporate backing.', 6, 7, 4, "/image/cards/Hanako_Arasaka.png"),
(14, 'Placid', 'Voodoo Boys netrunner leader. Strong but fragile glass cannon.', 8, 5, 4, "/image/cards/Placid.png"),
(15, 'Maman Brigitte', 'Voodoo Boys matriarch. Powerful netrunner with mystical abilities.', 7, 8, 5, "/image/cards/Maman_Brigitte.png"),
(16, 'Kerry Eurodyne', 'Aging rockerboy with attitude. Decent stats, mid-tier cost.', 6, 6, 3, "/image/cards/Kerry_Eurodyne.png"),
(17, 'Rogue Amendiares', 'Legendary fixer and former rockerboy. Strong veteran with high survivability.', 8, 10, 6, "/image/cards/Rogue_Amendiares.png"),
(18, 'Delamain', 'AI taxi service with multiple personalities. Unique defensive abilities.', 4, 14, 5, "/image/cards/Delamain.png"),
(19, 'Meredith Stout', 'Militech operative with corporate resources. Balanced corporate enforcer.', 6, 7, 4, "/image/cards/Meredith_Stout.png"),
(20, 'T-Bug', 'Skilled netrunner and hacker. Low health but strong attack for her cost.', 7, 3, 3, "/image/cards/T-Bug.png");

-- DROP DATABASE Race01;
-- DROP USER 'snazarenko'@'localhost';