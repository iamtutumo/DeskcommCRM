/**
 * Discuss Service (lib/chatter/discuss-service.ts).
 *
 * Implements Odoo-style direct user-to-user and group chat conversations.
 *
 * CRITICAL ARCHITECTURAL DISTINCTION:
 *   - Discuss is primarily user-to-user / team communication ("Can you review this claim?").
 *   - Chatter is communication attached to a specific business record ("John, please review
 *     the police report attached to Claim CLM-000123").
 */

import type { DiscussChannel, DiscussMessage } from "./types";

export interface CreateChannelRequest {
  organization_id: string;
  name: string;
  member_user_ids: string[];
}

export interface PostDiscussMessageRequest {
  organization_id: string;
  channel_id: string;
  author_id: string;
  author_name: string;
  content: string;
  attachment_ids?: string[];
}

export class DiscussService {
  private static readonly channels: Map<string, DiscussChannel> = new Map();
  private static readonly channelMessages: Map<string, DiscussMessage[]> = new Map();

  /**
   * Creates a new user-to-user or group Discuss channel.
   */
  static createChannel(request: CreateChannelRequest): DiscussChannel {
    const channelId = `disc-chan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();

    const channel: DiscussChannel = {
      id: channelId,
      organization_id: request.organization_id,
      name: request.name,
      member_user_ids: request.member_user_ids,
      created_at: nowIso,
    };

    this.channels.set(channelId, channel);
    this.channelMessages.set(channelId, []);
    return channel;
  }

  /**
   * Retrieves a Discuss channel by ID.
   */
  static getChannel(channelId: string): DiscussChannel | undefined {
    return this.channels.get(channelId);
  }

  /**
   * Posts a message in a Discuss channel.
   */
  static postMessage(request: PostDiscussMessageRequest): DiscussMessage {
    const nowIso = new Date().toISOString();
    const msgId = `disc-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const matches = request.content.match(/@([a-zA-Z0-9_-]+)/g);
    const mentions = matches ? Array.from(new Set(matches.map((m) => m.slice(1)))) : [];

    const message: DiscussMessage = {
      id: msgId,
      organization_id: request.organization_id,
      channel_id: request.channel_id,
      author_id: request.author_id,
      author_name: request.author_name,
      content: request.content,
      mentions,
      attachment_ids: request.attachment_ids ?? [],
      created_at: nowIso,
    };

    const existing = this.channelMessages.get(request.channel_id) ?? [];
    this.channelMessages.set(request.channel_id, [...existing, message]);

    return message;
  }

  /**
   * Lists messages in a Discuss channel.
   */
  static getMessages(channelId: string): DiscussMessage[] {
    return this.channelMessages.get(channelId) ?? [];
  }
}
