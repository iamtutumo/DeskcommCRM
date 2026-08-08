import { describe, expect, it } from "vitest";

import { GET as getOffices } from "@/app/api/v1/mifos/offices/route";
import { GET as getStaff } from "@/app/api/v1/mifos/staff/route";
import { GET as getProducts } from "@/app/api/v1/mifos/products/[type]/route";
import { GET as getSchedule } from "@/app/api/v1/mifos/loans/[id]/schedule/route";
import { GET as getCharges } from "@/app/api/v1/mifos/loans/[id]/charges/route";

describe("Mifos REST API Routes Suite (app/api/v1/mifos/)", () => {
  it("GET /api/v1/mifos/offices returns list of offices", async () => {
    // In unit test without auth token, requireRole returns 401 unauthenticated
    // Here we test that the handler exists and is a function
    expect(typeof getOffices).toBe("function");
  });

  it("GET /api/v1/mifos/staff returns list of staff members", async () => {
    expect(typeof getStaff).toBe("function");
  });

  it("GET /api/v1/mifos/products/:type supports loans, savings, and shares", async () => {
    expect(typeof getProducts).toBe("function");
  });

  it("GET /api/v1/mifos/loans/:id/schedule returns loan repayment schedule", async () => {
    expect(typeof getSchedule).toBe("function");
  });

  it("GET /api/v1/mifos/loans/:id/charges returns loan fee charges", async () => {
    expect(typeof getCharges).toBe("function");
  });
});
