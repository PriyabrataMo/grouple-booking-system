-- MySQL dump 10.13  Distrib 8.0.41, for Linux (x86_64)
--
-- Host: grouple-booking.c5ky0w4ogkab.ap-south-1.rds.amazonaws.com    Database: grouple-booking
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Current Database: `grouple-booking`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `grouple-booking` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `grouple-booking`;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `userId` int unsigned NOT NULL,
  `restaurantId` int unsigned NOT NULL,
  `tableId` int unsigned DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `startTime` datetime NOT NULL,
  `endTime` datetime NOT NULL,
  `status` enum('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
  `guestCount` int DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `restaurantId` (`restaurantId`),
  KEY `tableId` (`tableId`),
  CONSTRAINT `bookings_ibfk_31` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `bookings_ibfk_32` FOREIGN KEY (`restaurantId`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `bookings_ibfk_33` FOREIGN KEY (`tableId`) REFERENCES `restaurant_tables` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (1,2,1,NULL,'Reservation at KFC','','2025-04-20 05:00:00','2025-04-20 07:30:00','pending',1,'2025-04-18 08:27:33','2025-04-18 08:27:33'),(2,2,1,NULL,'Reservation at KFC','','2025-04-23 04:00:00','2025-04-23 07:00:00','confirmed',1,'2025-04-18 08:28:45','2025-04-18 08:30:13'),(3,2,1,NULL,'Reservation at KFC','','2025-04-28 04:30:00','2025-04-28 07:30:00','pending',1,'2025-04-18 08:55:57','2025-04-18 08:55:57'),(4,3,1,NULL,'Reservation at KFC','','2025-04-18 07:00:00','2025-04-18 08:30:00','pending',1,'2025-04-18 16:42:06','2025-04-18 16:42:06');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `restaurantId` int unsigned NOT NULL,
  `bookingId` int unsigned NOT NULL,
  `senderId` varchar(255) NOT NULL,
  `sender` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `timestamp` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `restaurant_index` (`restaurantId`),
  KEY `booking_index` (`bookingId`),
  CONSTRAINT `chat_messages_ibfk_21` FOREIGN KEY (`restaurantId`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chat_messages_ibfk_22` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
INSERT INTO `chat_messages` VALUES ('1606e82f-5269-4af2-9f5b-fdb82312f581',1,1,'2','Mondal','hi','2025-04-18 08:27:51','2025-04-18 08:27:51','2025-04-18 08:27:51'),('24e24bc2-995b-4dc9-972d-88204cacac6f',1,4,'1','Priyabrata','huejdznx','2025-04-18 19:05:07','2025-04-18 19:05:07','2025-04-18 19:05:07'),('61040596-7d92-4bb9-9942-230499d30233',1,4,'3','sk','bhadwe','2025-04-18 16:42:22','2025-04-18 16:42:22','2025-04-18 16:42:22'),('65052d60-f9fb-43ef-bfa0-75e9f6de8ff3',1,4,'1','Priyabrata','dnnskac','2025-04-18 19:03:39','2025-04-18 19:03:39','2025-04-18 19:03:39'),('b7dff42a-06a0-46f4-9ddf-5228117a4dc1',1,3,'2','Mondal','huu','2025-04-18 12:04:50','2025-04-18 12:04:50','2025-04-18 12:04:50'),('db6f73d6-5551-4d31-9baf-45b51560903b',1,1,'1','Priyabrata','hello','2025-04-18 08:27:45','2025-04-18 08:27:45','2025-04-18 08:27:45'),('dbee39ca-cbb1-4405-933d-f45240b14a49',1,4,'1','Priyabrata','hemlo','2025-04-18 16:43:28','2025-04-18 16:43:28','2025-04-18 16:43:28'),('fdd17a5d-b6a9-4232-8286-7f4b787968ef',1,4,'3','sk','hii','2025-04-18 19:06:03','2025-04-18 19:06:03','2025-04-18 19:06:03');
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurant_tables`
--

DROP TABLE IF EXISTS `restaurant_tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_tables` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `restaurantId` int unsigned NOT NULL,
  `tableNumber` int NOT NULL,
  `capacity` int NOT NULL,
  `isAvailable` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `restaurant_tables_restaurant_id_table_number` (`restaurantId`,`tableNumber`),
  CONSTRAINT `restaurant_tables_ibfk_1` FOREIGN KEY (`restaurantId`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurant_tables`
--

LOCK TABLES `restaurant_tables` WRITE;
/*!40000 ALTER TABLE `restaurant_tables` DISABLE KEYS */;
/*!40000 ALTER TABLE `restaurant_tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurants`
--

DROP TABLE IF EXISTS `restaurants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurants` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `description` text,
  `cuisine` varchar(255) NOT NULL,
  `openingTime` varchar(255) NOT NULL,
  `closingTime` varchar(255) NOT NULL,
  `imageUrl` varchar(255) DEFAULT NULL,
  `userId` int unsigned NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `restaurants_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurants`
--

LOCK TABLES `restaurants` WRITE;
/*!40000 ALTER TABLE `restaurants` DISABLE KEYS */;
INSERT INTO `restaurants` VALUES (1,'KFC','DLF 1',NULL,'American','09:00','22:00','https://grouple-user-uploads.s3.ap-south-1.amazonaws.com/restaurant-images/2485c662-7e09-4637-94d9-aa75ee4780dd.webp',1,'2025-04-18 08:24:52','2025-04-18 08:24:52');
/*!40000 ALTER TABLE `restaurants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fullName` varchar(100) DEFAULT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username_2` (`username`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `username_3` (`username`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `username_4` (`username`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `username_5` (`username`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `username_6` (`username`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `username_7` (`username`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `username_8` (`username`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `username_9` (`username`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `username_10` (`username`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `username_11` (`username`),
  UNIQUE KEY `email_11` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'priyo','priyabrata8558@gmail.com','$2b$10$phCAH6gzXILWqcbsUJPlP.G6FZkjID/LNW2oM2frZE5LVspG7AiO6','Priyabrata','admin','2025-04-18 08:24:22','2025-04-18 08:24:22'),(2,'userPriyo','prybruhta@gmail.com','$2b$10$jHtrU3LUk8nMgE6oeuQtK.2cDl25JPj.DtDOLTvgA4XJTNPFRx9jC','Mondal','user','2025-04-18 08:25:32','2025-04-18 08:25:32'),(3,'shubhamku044','sk@xyz.com','$2b$10$b/GLlmMQ5n2yayYzxF1FNO1V0EmwzOxgywBZrd/8fqdvlBtm21cQm','sk','user','2025-04-18 16:40:01','2025-04-18 16:40:01'),(4,'priyabrata8558@gmail.com','two@gmail.com','$2b$10$pq4f.KCaHbCHyqTjv.TRdOzh4GC4ghEJT4IIH./gWZnETeFGs/opW','xcdsc','user','2025-04-18 16:50:05','2025-04-18 16:50:05'),(5,'sk1234','12@34.com','$2b$12$o6uhzLKPbbxc4AjTJLFgN.ILCy80/.3aoW6xE1yo7MCIrLrXl12Ey',NULL,'user','2025-04-18 17:07:48','2025-04-18 17:07:48');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-18 19:10:36
