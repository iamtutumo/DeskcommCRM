/**
 * Odoo-Inspired Business Record Collaboration & Audit Suite (lib/chatter/).
 *
 * Implements 13 distinct collaboration and accountability concepts around
 * business records:
 *   1. Audit Trail (system history of record field changes)
 *   2. Chatter (record-attached communication panel)
 *   3. Followers (users receiving record notifications)
 *   4. Mentions (@username alerts inside Chatter)
 *   5. Discuss (direct user-to-user and group chat)
 *   6. Document Followers & Attachments
 *   7. Sending Email from Record
 *   8. Email Replies associated to Chatter
 *   9. Activities (action items with due dates)
 *  10. Complete Lifecycle Unified Timeline
 */

export * from "./activity-service";
export * from "./attachment-service";
export * from "./audit-trail-service";
export * from "./chatter-service";
export * from "./discuss-service";
export * from "./email-service";
export * from "./follower-service";
export * from "./types";
export * from "./unified-history";
