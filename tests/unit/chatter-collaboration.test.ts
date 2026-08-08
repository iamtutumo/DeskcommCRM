import { describe, expect, it } from "vitest";

import { ChatterService } from "@/lib/chatter/chatter-service";
import { DiscussService } from "@/lib/chatter/discuss-service";
import { FollowerService } from "@/lib/chatter/follower-service";

describe("Chatter, Followers, Mentions, and Discuss Collaboration Suite", () => {
  const testOrgId = "org-collab-001";

  it("subscribes followers to a record and dispatches notifications when events occur", () => {
    const follower = FollowerService.addFollower({
      organization_id: testOrgId,
      record_type: "claim",
      record_id: "CLM-999000",
      user_id: "user-sarah",
      user_name: "Sarah",
      user_email: "sarah@example.com",
    });

    expect(follower.user_name).toBe("Sarah");
    expect(follower.subscribed_events).toContain("new_message");

    const followers = FollowerService.getFollowers(
      testOrgId,
      "claim",
      "CLM-999000",
    );
    expect(followers).toHaveLength(1);
  });

  it("parses @username mentions in Chatter messages and generates mention alerts", () => {
    const res = ChatterService.postMessage({
      organization_id: testOrgId,
      record_type: "claim",
      record_id: "CLM-999000",
      author_id: "user-john",
      author_name: "John",
      content:
        "@Sarah Please verify the accident photos before sending @David this claim.",
    });

    expect(res.message.mentions).toEqual(["Sarah", "David"]);
    expect(res.mentions).toHaveLength(2);
    expect(res.mentions[0]?.mentioned_user_name).toBe("Sarah");
    expect(res.mentions[1]?.mentioned_user_name).toBe("David");
    expect(res.follower_notification_id).toBeDefined();
  });

  it("creates direct user-to-user and group Discuss channels separate from record Chatter", () => {
    const chan = DiscussService.createChannel({
      organization_id: testOrgId,
      name: "Claims Investigation Team",
      member_user_ids: ["user-john", "user-sarah"],
    });

    const msg = DiscussService.postMessage({
      organization_id: testOrgId,
      channel_id: chan.id,
      author_id: "user-john",
      author_name: "John",
      content: "Can you review claim CLM-999000?",
    });

    expect(msg.channel_id).toBe(chan.id);
    const history = DiscussService.getMessages(chan.id);
    expect(history).toHaveLength(1);
  });
});
