"use client";

/**
 * RecordChatterPanel — Odoo-Inspired Record Collaboration & Audit UI Component.
 *
 * Displays the Unified Record History Timeline on a business record (claim,
 * loan, customer, opportunity, invoice). Supports tab filtering to view
 * specifically the immutable Audit Trail (system history), Chatter notes,
 * Activities, Emails, or Attachments.
 */

import * as React from "react";
import type { RecordEntityType, UnifiedRecordHistoryEntry } from "@/lib/chatter/types";

export interface RecordChatterPanelProps {
  organizationId: string;
  recordType: RecordEntityType;
  recordId: string;
  initialEntries?: UnifiedRecordHistoryEntry[];
}

type FilterTab = "all" | "audit" | "chatter" | "activity" | "email" | "attachment";

export function RecordChatterPanel({
  recordType,
  recordId,
  initialEntries = [],
}: RecordChatterPanelProps): React.JSX.Element {
  const [activeTab, setActiveTab] = React.useState<FilterTab>("all");
  const [entries, setEntries] = React.useState<UnifiedRecordHistoryEntry[]>(initialEntries);
  const [newNote, setNewNote] = React.useState("");

  const filteredEntries = React.useMemo(() => {
    if (activeTab === "all") return entries;
    return entries.filter((e) => e.entry_type === activeTab);
  }, [activeTab, entries]);

  const handlePostNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const newEntry: UnifiedRecordHistoryEntry = {
      id: `chatter-${Date.now()}`,
      entry_type: "chatter",
      timestamp: new Date().toISOString(),
      author_name: "Current User",
      title: "Chatter Note",
      details: newNote,
      payload: {},
    };

    setEntries((prev) => [...prev, newEntry]);
    setNewNote("");
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "audit":
        return "bg-amber-100 text-amber-800 border-amber-300"; // Distinct warning/system history
      case "activity":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "email":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "attachment":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="flex flex-col border rounded-lg bg-card text-card-foreground shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold text-lg">
            Record Collaboration & Audit Trail
          </h3>
          <p className="text-xs text-muted-foreground">
            {recordType.toUpperCase()} #{recordId} • Single Source of Truth
          </p>
        </div>
        <div className="flex space-x-1 text-xs">
          {(
            [
              ["all", "All History"],
              ["audit", "Audit Trail (System)"],
              ["chatter", "Chatter Notes"],
              ["activity", "Activities"],
              ["email", "Emails"],
              ["attachment", "Attachments"],
            ] as const
          ).map(([tabKey, tabLabel]) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveTab(tabKey)}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === tabKey
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {tabLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List */}
      <div className="divide-y max-h-96 overflow-y-auto p-4 space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No entries found in this view.
          </div>
        ) : (
          filteredEntries.map((item) => (
            <div
              key={item.id}
              className="flex flex-col space-y-1 py-2 text-sm border-l-2 pl-3 border-muted hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded border font-semibold uppercase ${getBadgeColor(
                      item.entry_type,
                    )}`}
                  >
                    {item.entry_type === "audit" ? "System Audit" : item.entry_type}
                  </span>
                  <span className="font-medium text-foreground">
                    {item.title}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleString()} • {item.author_name}
                </span>
              </div>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {item.details}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Message / Note Composer */}
      <form onSubmit={handlePostNote} className="border-t p-3 bg-muted/30">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write a note in Chatter... (Use @username to mention or escalate)"
            className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Post Note
          </button>
        </div>
      </form>
    </div>
  );
}
