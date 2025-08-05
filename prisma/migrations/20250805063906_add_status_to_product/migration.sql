-- AlterTable
ALTER TABLE `product` ADD COLUMN `status` ENUM('pending', 'success', 'fail') NOT NULL DEFAULT 'pending';
