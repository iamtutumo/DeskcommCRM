---
title: Technical Specification 19 — Odoo-Inspired Business Record Collaboration & Audit Suite
parent: 08-prd-record-chatter-audit.md
depends_on: 01-spec-platform-base.md, 18-spec-mifos-microfinance.md
version: 0.1
status: in review
date: 2026-08-08
owner: Tutu Moses (iamtutumo) & Open Source Community
referencia_arquitetural: VISION.md
business_rules: C-01, C-02, C-03, C-04, C-05, C-06, C-07, C-08, C-09, C-10
---

# Technical Specification 19 — Odoo-Inspired Business Record Collaboration & Audit Suite

> Technical specification for Sub-PRD 08. Defines the data model, invariants, and TypeScript service contracts in `lib/chatter/` implementing 13 Odoo-inspired collaboration and audit concepts around business records.

---

## 1. Architecture & Concept Separation Diagram

```
                              ┌─────────────────────────────────────────┐
                              │     BUSINESS RECORD SINGLE SOURCE       │
                              │     (Claim CLM-000123 / Loan L-100)     │
                              └────────────────────┬────────────────────┘
                                                   │
     ┌──────────────────────┬──────────────────────┼──────────────────────┬──────────────────────┐
     ▼                      ▼                      ▼                      ▼                      ▼
┌──────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ Audit Trail  │   │     Chatter      │   │    Followers     │   │    Activities    │   │   Attachments    │
│  (System     │   │  (Record Notes,  │   │  (Subscription   │   │  (Action Items   │   │ (ID, Police      │
│  History)    │   │ Mentions, Email) │   │  Notifications)  │   │  with Due Dates) │   │  Report, Photos) │
└──────────────┘   └────────┬─────────┘   └──────────────────┘   └──────────────────┘   └──────────────────┘
                            │
                            ▼
                   ┌──────────────────┐               ┌───────────────────────────────────────┐
                   │  RecordMentions  │               │      Discuss (User-to-User Chat)      │
                   │   (@username     │               │   (Completely Separate from Record    │
                   │   Escalation)    │               │    Chatter — Team Channel Rooms)      │
                   └──────────────────┘               └───────────────────────────────────────┘
```

---

## 2. Business Rules & Invariants

* **C-01 (Audit Trail Immutability):** `AuditTrailService.recordFieldChange()` generates immutable system history entries (`AuditTrailEntry`) recording timestamp, user attribution, field name, previous value, and new value. Entries cannot be edited or deleted.
* **C-02 (Chatter vs. Discuss Separation):** `ChatterMessage` entities belong strictly to a business record (`record_type`, `record_id`); `DiscussMessage` entities belong strictly to user chat channels (`channel_id`), ensuring record history is not polluted by casual user banter.
* **C-03 (Automated Follower Notifications):** Status changes, note postings, and document uploads invoke `FollowerService.notifyFollowers()`, alerting all subscribed `RecordFollower` members.
* **C-04 (Mention Escalation):** Parsing `@username` in Chatter notes creates a dedicated `RecordMention` alert for the mentioned user, enabling immediate SLA escalation.
* **C-05 (Email Chatter Association):** Outbound emails sent via `RecordEmailService.sendEmailFromRecord()` and inbound replies associated via `associateIncomingReply()` automatically generate an email entry in the record's Chatter timeline.
* **C-06 (Unified Lifecycle Timeline):** `UnifiedRecordHistoryService.getUnifiedHistory()` merges Audit Trail entries, Chatter notes, Activities, Emails, and Attachments into a chronologically sorted single source of truth (`UnifiedRecordHistoryEntry[]`).
* **C-07 (Activity Due Date Enforcement):** Action items (`RecordActivity`) created via `ActivityService.createActivity()` must specify an assigned user (`assigned_to_user_id`) and a valid ISO due date (`YYYY-MM-DD`).
* **C-08 (Attachment Metadata Preservation):** `AttachmentService.attachDocument()` records file size, MIME type, storage path, and uploader attribution.
* **C-09 (Multi-Entity Compatibility):** The suite supports business records across `claim`, `loan`, `customer`, `opportunity`, `invoice`, and `ticket` entity types.
* **C-10 (Strict Tenant RLS Isolation):** All 9 collaboration tables enforce organization-level Row Level Security (`organization_id = ANY (fn_user_org_ids())`).

---

## 3. Database Model (`supabase/migrations/20260808180000_0134_record_chatter_and_audit_trail.sql`)

* `record_audit_trail`: Immutable system history (`record_type`, `record_id`, `field_name`, `old_value`, `new_value`, `changed_by_name`, `changed_at`).
* `record_chatter_messages`: Record-attached communication notes and emails (`message_type`, `content`, `mentions`, `attachment_ids`).
* `record_followers`: Record subscriptions (`user_id`, `user_email`, `subscribed_events`).
* `record_mentions`: Direct `@username` alerts (`chatter_message_id`, `mentioned_user_name`, `is_read`).
* `record_activities`: Assigned action items (`activity_type`, `summary`, `assigned_to_user_id`, `due_date`, `status: pending|completed|overdue`, `completed_at`).
* `record_emails`: Outbound and inbound email communication (`direction`, `from_address`, `to_addresses`, `subject`, `body_html`, `message_id`).
* `record_attachments`: Document evidence files (`file_name`, `file_size`, `mime_type`, `storage_path`).
* `user_discuss_channels`: Direct user-to-user and team chat rooms (`name`, `member_user_ids`).
* `user_discuss_messages`: Direct team chat messages (`channel_id`, `author_name`, `content`).
* All tables enable Row Level Security (`organization_id = ANY (fn_user_org_ids())`).

---

## 4. TypeScript Service Layer (`lib/chatter/`)

1. `types.ts`: TypeScript definitions for all 9 domain entities and unified timeline entries.
2. `audit-trail-service.ts`: `AuditTrailService.recordFieldChange()` and `diffAndRecord()`.
3. `chatter-service.ts`: `ChatterService.postMessage()`, `@username` mention parser, and follower alerts.
4. `follower-service.ts`: `FollowerService.addFollower()`, `removeFollower()`, and `notifyFollowers()`.
5. `activity-service.ts`: `ActivityService.createActivity()`, `completeActivity()`, and query filters.
6. `email-service.ts`: `RecordEmailService.sendEmailFromRecord()` and `associateIncomingReply()`.
7. `discuss-service.ts`: `DiscussService.createChannel()` and `postMessage()`.
8. `attachment-service.ts`: `AttachmentService.attachDocument()`.
9. `unified-history.ts`: `UnifiedRecordHistoryService.getUnifiedHistory()` chronological aggregator.
10. `index.ts`: Unified module exports.
