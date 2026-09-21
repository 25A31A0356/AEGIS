CREATE TABLE `community_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`hazard` varchar(64) NOT NULL,
	`severity` enum('Low','Medium','High') NOT NULL DEFAULT 'Medium',
	`details` text NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'pending_review',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `safe_pings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`contact` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'queued',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `safe_pings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sos_beacons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`hazard` varchar(64) NOT NULL,
	`people` int NOT NULL DEFAULT 1,
	`note` text,
	`status` varchar(32) NOT NULL DEFAULT 'prototype_recorded',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sos_beacons_id` PRIMARY KEY(`id`)
);
