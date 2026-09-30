ALTER TABLE `customers` ADD `email` text;--> statement-breakpoint
ALTER TABLE `mrr_movements` ADD `churn_reason` enum('canceled','scheduled','unpaid','paused');--> statement-breakpoint
ALTER TABLE `mrr_movements` ADD `ends_at` datetime(6);--> statement-breakpoint
ALTER TABLE `payments` ADD `customer_email` text;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `customer_email` text;--> statement-breakpoint
-- Churns recorded before their reasons were kept: the last movement of each subscription that
-- still brings no MRR takes the reason its status tells. Older churns stay without one.
UPDATE `mrr_movements` `m`
JOIN `subscriptions` `s`
  ON `s`.`account_id` = `m`.`account_id`
  AND `s`.`stripe_subscription_id` = `m`.`stripe_subscription_id`
JOIN (
  SELECT `account_id`, `stripe_subscription_id`, MAX(`occurred_at`) AS `last_at`
  FROM `mrr_movements`
  GROUP BY `account_id`, `stripe_subscription_id`
) `latest`
  ON `latest`.`account_id` = `m`.`account_id`
  AND `latest`.`stripe_subscription_id` = `m`.`stripe_subscription_id`
  AND `latest`.`last_at` = `m`.`occurred_at`
SET `m`.`churn_reason` = CASE
  WHEN `s`.`status` IN ('canceled', 'incomplete_expired') THEN 'canceled'
  WHEN `s`.`status` = 'unpaid' THEN 'unpaid'
  WHEN `s`.`status` = 'paused' THEN 'paused'
  WHEN `s`.`cancel_at_period_end` THEN 'scheduled'
END
WHERE `m`.`kind` = 'churn' AND `s`.`mrr` = 0;
