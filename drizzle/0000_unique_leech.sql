CREATE TABLE `account` (
	`id` varchar(36) NOT NULL,
	`account_id` varchar(255) NOT NULL,
	`provider_id` varchar(255) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` datetime(3),
	`refresh_token_expires_at` datetime(3),
	`scope` text,
	`password` text,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `account_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_deliveries` (
	`id` varchar(36) NOT NULL,
	`reservation_id` varchar(36),
	`category` varchar(64) NOT NULL,
	`recipient` varchar(255) NOT NULL,
	`provider_id` varchar(255),
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`error` text,
	`attempts` int NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `email_deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitation` (
	`id` varchar(36) NOT NULL,
	`organization_id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`role` varchar(32),
	`status` varchar(32) NOT NULL DEFAULT 'pending',
	`expires_at` datetime(3) NOT NULL,
	`inviter_id` varchar(36) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `invitation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `member` (
	`id` varchar(36) NOT NULL,
	`organization_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`role` varchar(32) NOT NULL DEFAULT 'admin',
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `member_id` PRIMARY KEY(`id`),
	CONSTRAINT `member_org_user_unique` UNIQUE(`organization_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `organization` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`logo` text,
	`created_at` datetime(3) NOT NULL,
	`metadata` text,
	CONSTRAINT `organization_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `reservation_audit_logs` (
	`id` varchar(36) NOT NULL,
	`reservation_id` varchar(36) NOT NULL,
	`actor_user_id` varchar(36),
	`action` varchar(64) NOT NULL,
	`before` json,
	`after` json,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `reservation_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reservation_capacity_slots` (
	`slot_start` datetime(3) NOT NULL,
	`held_guests` int NOT NULL DEFAULT 0,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `reservation_capacity_slots_slot_start` PRIMARY KEY(`slot_start`),
	CONSTRAINT `capacity_held_guests_check` CHECK(`reservation_capacity_slots`.`held_guests` >= 0 and `reservation_capacity_slots`.`held_guests` <= 50)
);
--> statement-breakpoint
CREATE TABLE `reservation_slot_allocations` (
	`reservation_id` varchar(36) NOT NULL,
	`slot_start` datetime(3) NOT NULL,
	`guest_count` int NOT NULL,
	CONSTRAINT `reservation_slot_allocations_reservation_id_slot_start_pk` PRIMARY KEY(`reservation_id`,`slot_start`)
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` varchar(36) NOT NULL,
	`reference` varchar(24) NOT NULL,
	`type` enum('regular_group','private_event','meeting_workshop') NOT NULL,
	`status` enum('pending','confirmed','rejected') NOT NULL DEFAULT 'pending',
	`starts_at` datetime(3) NOT NULL,
	`ends_at` datetime(3) NOT NULL,
	`guest_count` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`special_request` text,
	`rejection_reason` text,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `reservations_id` PRIMARY KEY(`id`),
	CONSTRAINT `reservation_reference_unique` UNIQUE(`reference`),
	CONSTRAINT `reservation_guest_count_check` CHECK(`reservations`.`guest_count` between 1 and 50),
	CONSTRAINT `reservation_time_check` CHECK(`reservations`.`ends_at` > `reservations`.`starts_at`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(36) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	`ip_address` varchar(255),
	`user_agent` text,
	`user_id` varchar(36) NOT NULL,
	`active_organization_id` varchar(36),
	CONSTRAINT `session_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` text,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` varchar(36) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`created_at` datetime(3),
	`updated_at` datetime(3),
	CONSTRAINT `verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_deliveries` ADD CONSTRAINT `email_deliveries_reservation_id_reservations_id_fk` FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invitation` ADD CONSTRAINT `invitation_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invitation` ADD CONSTRAINT `invitation_inviter_id_user_id_fk` FOREIGN KEY (`inviter_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member` ADD CONSTRAINT `member_organization_id_organization_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member` ADD CONSTRAINT `member_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reservation_audit_logs` ADD CONSTRAINT `reservation_audit_logs_reservation_id_reservations_id_fk` FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reservation_audit_logs` ADD CONSTRAINT `reservation_audit_logs_actor_user_id_user_id_fk` FOREIGN KEY (`actor_user_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reservation_slot_allocations` ADD CONSTRAINT `reservation_slot_allocations_reservation_id_reservations_id_fk` FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reservation_slot_allocations` ADD CONSTRAINT `reservation_slot_allocations_slot_start_reservation_capacity_slots_slot_start_fk` FOREIGN KEY (`slot_start`) REFERENCES `reservation_capacity_slots`(`slot_start`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `account_user_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `email_reservation_idx` ON `email_deliveries` (`reservation_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `invitation_email_idx` ON `invitation` (`email`);--> statement-breakpoint
CREATE INDEX `invitation_org_idx` ON `invitation` (`organization_id`);--> statement-breakpoint
CREATE INDEX `member_user_idx` ON `member` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_reservation_idx` ON `reservation_audit_logs` (`reservation_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `allocation_slot_idx` ON `reservation_slot_allocations` (`slot_start`);--> statement-breakpoint
CREATE INDEX `reservation_starts_at_idx` ON `reservations` (`starts_at`);--> statement-breakpoint
CREATE INDEX `reservation_status_start_idx` ON `reservations` (`status`,`starts_at`);--> statement-breakpoint
CREATE INDEX `reservation_email_idx` ON `reservations` (`email`);--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);