---
title: Sub-PRD 08 — Odoo-Inspired Business Record Collaboration & Audit Suite
parent: 00-prd-master.md
depends_on: 01-prd-platform-base.md, 02-prd-customer-360.md, 07-prd-mifos-microfinance.md
version: 0.1
status: in review
date: 2026-08-08
owner: Tutu Moses (iamtutumo) & Open Source Community
referencia_arquitetural: VISION.md
---

# Sub-PRD 08 — Odoo-Inspired Business Record Collaboration & Audit Suite

> Encompasses 13 distinct but connected collaboration and accountability concepts around business records: Audit Trail, Chatter, Record Followers, User Mentions, Direct User/Group Discuss Chat, Document Followers & Attachments, Outbound Emails, Inbound Email Replies, Actionable Activities, Mentions Escalation, File Attachments, Unified Lifecycle Timeline, and clear separation of concepts.

---

## 1. Context & Positioning

To operate complex workflow-driven applications (e.g., claims triage systems, microfinance loan underwriting, or customer servicing), teams require a single place where a business record (claim, loan, opportunity, invoice) serves as an authoritative virtual folder and communication hub.

Without an integrated collaboration suite, teams fragment their communication across external email threads, instant messaging tools, and manual spreadsheets. By adapting **Odoo's proven Chatter and Audit Trail architecture** into DeskcommCRM (`lib/chatter/`), we establish every business record as the single source of truth answering: *"Who did what, when, why, what documents were added, who was notified, and what communication happened?"*

---

## 2. The 13 Core Concepts & Purpose Matrix

| # | Feature / Concept | Purpose & Behavior in DeskcommCRM |
|---|---|---|
| **1** | **Audit Trail (`AuditTrailService`)** | Immutable system history recording changes to important fields (e.g., status `Pending` → `Approved`, officer `David` → `Sarah`, amount). Tracks who changed it, timestamp, field name, previous value, and new value. Completely separate from Chatter collaboration. |
| **2** | **Chatter (`ChatterService`)** | The communication panel attached to a specific record. Displays internal notes, emails, attachments, activities, and mentions. Users post messages (`"Please verify accident photos..."`) visible to authorized team members. |
| **3** | **Following a Record (`FollowerService`)** | Users follow individual records (`Claims Officer → Supervisor → Investigator → Head of Operations`) to receive instant notifications when status changes, notes are posted, or documents are uploaded, without opening the record. |
| **4** | **Following Users / Mentions (`RecordMention`)** | Users communicate around the business record using `@username` mentions (`"@John Please review the accident report"`). John receives a direct notification alert linked to the record. |
| **5** | **Chat Between Users (`DiscussService`)** | Direct user-to-user and group conversations (`Discuss`), separate from record-level Chatter. Used for general team communication (`"Can you review this claim?"`) while record Chatter holds formal case history. |
| **6** | **Following a Document** | Documents attached to a record retain subscriber notifications, ensuring stakeholders are alerted whenever critical evidence or contracts are uploaded. |
| **7** | **Sending Email from Record (`RecordEmailService`)** | Send external emails to customers/borrowers directly from the Chatter. Records recipients, CC/BCC, subject, body, and attachments in the record's communication timeline. |
| **8** | **Email Replies** | Incoming email replies from customers are automatically associated with the record's Chatter without requiring manual copying. |
| **9** | **Activities (`ActivityService`)** | Action items (`Call`, `Email`, `Meeting`, `To Do`, `Review Document`, `Follow-up`) assigned to specific users with due dates (`"Review claim documents — Due Aug 10"`). Tracks completion timestamps and user attribution. |
| **10** | **Mentions for Escalation** | Direct `@user` attention alerts used for SLA escalation (`"@Supervisor This claim has exceeded the 48-hour SLA"`). Distinct from generic follower alerts. |
| **11** | **Attachments (`AttachmentService`)** | Storing files (`ID.pdf`, `Police_Report.pdf`, `Accident_Photos.zip`) on the record. Files remain permanently associated and can be referenced in Chatter notes. |
| **12** | **Unified Record History (`UnifiedRecordHistoryService`)** | Combines Audit Trail entries, Chatter notes, Activities, Emails, and Attachments into a single, chronologically sorted lifecycle timeline. |
| **13** | **Clear Separation of Concepts** | Architectural isolation ensuring that Audit Trail remains an immutable system log, Chatter serves record-attached collaboration, Discuss handles team chat, and Activities drive task execution. |

---

## 3. Success Metrics

* **100% Accountability:** Every critical field change generates an immutable audit trail entry.
* **Unified Case Visibility:** Teams answer customer inquiries without switching to external email or chat clients.
* **SLA Adherence:** Assigning due-dated activities and `@supervisor` escalation mentions reduces case resolution bottlenecks by >40%.
