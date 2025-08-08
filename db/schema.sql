DROP DATABASE IF EXISTS `lnmchess`;
CREATE DATABASE `lnmchess`;
USE `lnmchess`;

CREATE TABLE `user` (
    `id` int NOT NULL AUTO_INCREMENT,
    `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `username` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
    `passwordHash` text COLLATE utf8mb4_unicode_ci NOT NULL,
    `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `refresh_token` (
    `id` int NOT NULL AUTO_INCREMENT,
    `token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `device` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
    `expiresAt` datetime DEFAULT NULL,
    `userId` int DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `token` (`token`),
    KEY `userId` (`userId`),
    CONSTRAINT `refresh_token_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `match` (
    `id` int NOT NULL AUTO_INCREMENT,
    `status` enum('ONGOING','FINISHED') COLLATE utf8mb4_unicode_ci NOT NULL,
    `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
    `winnerId` int DEFAULT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `match_ibfk_1` FOREIGN KEY (`winnerId`) REFERENCES `user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `match_move` (
    `id` int NOT NULL AUTO_INCREMENT,
    `matchId` int NOT NULL,
    `playerId` int,
    `moveNumber` int NOT NULL,
    `fromX` tinyint NOT NULL,
    `fromY` tinyint NOT NULL,
    `toX` tinyint NOT NULL,
    `toY` tinyint NOT NULL,
    `pieceType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
    `capturedPieceType` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `specialAbilityUsed` tinyint DEFAULT '0',
    `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `matchId` (`matchId`),
    KEY `playerId` (`playerId`),
    CONSTRAINT `match_move_ibfk_1` FOREIGN KEY (`matchId`) REFERENCES `match` (`id`) ON DELETE CASCADE,
    CONSTRAINT `match_move_ibfk_2` FOREIGN KEY (`playerId`) REFERENCES `user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `match_piece` (
    `id` int NOT NULL AUTO_INCREMENT,
    `matchId` int NOT NULL,
    `playerId` int,
    `type` enum('SLEEPLESS_EYE','PHANTOM_MATRIARCH','SHADOW_HUNTER','DOPPELGANGER','PHOBIC_LEAPER','PSYCHIC_LARVA') COLLATE utf8mb4_unicode_ci NOT NULL,
    `posX` tinyint DEFAULT NULL,
    `posY` tinyint DEFAULT NULL,
    `usedAbility` tinyint DEFAULT '0',
    `captured` tinyint DEFAULT '0',
    PRIMARY KEY (`id`),
    KEY `matchId` (`matchId`),
    KEY `playerId` (`playerId`),
    CONSTRAINT `match_piece_ibfk_1` FOREIGN KEY (`matchId`) REFERENCES `match` (`id`) ON DELETE CASCADE,
    CONSTRAINT `match_piece_ibfk_2` FOREIGN KEY (`playerId`) REFERENCES `user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `match_player` (
    `id` int NOT NULL AUTO_INCREMENT,
    `userId` int,
    `matchId` int NOT NULL,
    `color` enum('WHITE','BLACK') COLLATE utf8mb4_unicode_ci NOT NULL,
    PRIMARY KEY (`id`),
    KEY `matchId` (`matchId`),
    KEY `userId` (`userId`),
    CONSTRAINT `match_player_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE SET NULL,
    CONSTRAINT `match_player_ibfk_2` FOREIGN KEY (`matchId`) REFERENCES `match` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
