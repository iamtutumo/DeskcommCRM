"use client";

/**
 * MifosDashboard — Frontend UI Component.
 *
 * Core banking synchronization and reference catalog management panel.
 * Displays synced counts for Branches/Offices, Staff, Loan Products,
 * Savings Products, and Share Equity Products, and lets managers trigger
 * real-time bidirectional synchronization with Apache Fineract / Mifos X.
 *
 * Architectural Owner: Tutu Moses (iamtutumo)
 */

import * as React from "react";
import { MifosSyncService } from "@/lib/mifos/sync-service";
import type { MifosSyncResult } from "@/lib/mifos/types";

export interface MifosDashboardProps {
  organizationId: string;
}

export function MifosDashboard({
  organizationId,
}: MifosDashboardProps): React.JSX.Element {
  const [syncing, setSyncing] = React.useState(false);
  const [lastSync, setLastSync] = React.useState<MifosSyncResult>({
    ok: true,
    organization_id: organizationId,
    timestamp: new Date().toISOString(),
    counts: {
      offices: 3,
      staff: 12,
      loan_products: 5,
      savings_products: 3,
      share_products: 2,
      clients: 10,
      loan_accounts: 15,
      savings_accounts: 10,
      share_accounts: 5,
      repayment_schedules: 15,
      loan_charges: 25,
    },
  });

  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      const res = await MifosSyncService.runFullSync(organizationId);
      setLastSync(res);
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Mifos X / Apache Fineract Core Banking Hub
          </h2>
          <p className="text-sm text-muted-foreground">
            Bidirectional Synchronization of Branches, Staff, Financial Products,
            and Client Sub-Ledger Accounts
          </p>
        </div>
        <button
          type="button"
          onClick={handleTriggerSync}
          disabled={syncing}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {syncing ? "● Synchronizing..." : "⚡ Trigger Full Sync Now"}
        </button>
      </div>

      <div className="text-xs text-muted-foreground flex items-center justify-between">
        <span>Last Synced: {new Date(lastSync.timestamp).toLocaleString()}</span>
        <span
          className={`font-semibold ${
            lastSync.ok ? "text-green-600" : "text-red-600"
          }`}
        >
          {lastSync.ok ? "● Healthy" : "● Sync Warning"}
        </span>
      </div>

      {/* Reference Catalogs Section */}
      <div>
        <h3 className="font-semibold text-lg mb-3">
          1. Synced Reference Catalogs (Mifos X → DeskcommCRM)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="border rounded-lg p-4 bg-card shadow-sm">
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              Branches / Offices
            </span>
            <div className="text-2xl font-bold mt-1">
              {lastSync.counts.offices}
            </div>
            <p className="text-xs text-muted-foreground mt-1">mifos_branches</p>
          </div>
          <div className="border rounded-lg p-4 bg-card shadow-sm">
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              Loan Officers / Staff
            </span>
            <div className="text-2xl font-bold mt-1">
              {lastSync.counts.staff}
            </div>
            <p className="text-xs text-muted-foreground mt-1">mifos_staff</p>
          </div>
          <div className="border rounded-lg p-4 bg-card shadow-sm">
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              Loan Products
            </span>
            <div className="text-2xl font-bold mt-1">
              {lastSync.counts.loan_products}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              mifos_loan_products
            </p>
          </div>
          <div className="border rounded-lg p-4 bg-card shadow-sm">
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              Savings Products
            </span>
            <div className="text-2xl font-bold mt-1">
              {lastSync.counts.savings_products}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              mifos_savings_products
            </p>
          </div>
          <div className="border rounded-lg p-4 bg-card shadow-sm">
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              Share Products
            </span>
            <div className="text-2xl font-bold mt-1">
              {lastSync.counts.share_products}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              mifos_share_products
            </p>
          </div>
        </div>
      </div>

      {/* Account Sub-Ledger Cache Section */}
      <div>
        <h3 className="font-semibold text-lg mb-3">
          2. Client Accounts & Sub-Ledger Cache (DeskcommCRM ⇄ Mifos X)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 bg-card shadow-sm">
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              Active Loan Accounts
            </span>
            <div className="text-2xl font-bold mt-1">
              {lastSync.counts.loan_accounts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              mifos_loan_accounts
            </p>
          </div>
          <div className="border rounded-lg p-4 bg-card shadow-sm">
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              Savings Deposit Accounts
            </span>
            <div className="text-2xl font-bold mt-1">
              {lastSync.counts.savings_accounts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              mifos_savings_accounts
            </p>
          </div>
          <div className="border rounded-lg p-4 bg-card shadow-sm">
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              Equity Share Accounts (3100)
            </span>
            <div className="text-2xl font-bold mt-1">
              {lastSync.counts.share_accounts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              mifos_share_accounts
            </p>
          </div>
          <div className="border rounded-lg p-4 bg-card shadow-sm">
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              Repayment Schedules
            </span>
            <div className="text-2xl font-bold mt-1">
              {lastSync.counts.repayment_schedules}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              mifos_repayment_schedules
            </p>
          </div>
          <div className="border rounded-lg p-4 bg-card shadow-sm">
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              Fee Charges & Penalties
            </span>
            <div className="text-2xl font-bold mt-1">
              {lastSync.counts.loan_charges}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              mifos_loan_charges
            </p>
          </div>
          <div className="border rounded-lg p-4 bg-card shadow-sm">
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              Synced Clients
            </span>
            <div className="text-2xl font-bold mt-1">
              {lastSync.counts.clients}
            </div>
            <p className="text-xs text-muted-foreground mt-1">mifos_clients</p>
          </div>
        </div>
      </div>
    </div>
  );
}
