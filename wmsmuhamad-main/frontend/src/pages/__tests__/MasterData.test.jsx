import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MasterDataPage from "../MasterData/MasterData";
import api from "../../services/api";

// Mock API service
vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock layout so we focus exclusively on Master Data component
vi.mock("../../layout/DashboardLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

// Mock Auth service
vi.mock("../../services/authService", () => ({
  default: {
    getCurrentUser: () => ({
      name: "Muhammad Hafid",
      email: "hafid@electra.id",
      role: "Master"
    }),
  },
}));

describe("MasterDataPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", async () => {
    api.get.mockImplementation(() => new Promise(() => {})); // Never resolves to keep loading state active
    render(<MasterDataPage />);
    expect(screen.getByText("Memuat produk...")).toBeInTheDocument();
  });

  it("renders product data successfully once API resolves", async () => {
    // Mock Product list response
    api.get.mockImplementation((url) => {
      if (url === "/master/products") {
        return Promise.resolve({
          data: {
            status: "success",
            data: [
              {
                product_id: 1,
                internal_code: "PRD-TEST-001",
                product_name: "Test Led Widescreen",
                unit: "pcs",
                min_stock: 5,
                stocks_sum_qty_available: 45,
                is_active: true,
                category: { category_name: "Electronics" }
              }
            ]
          }
        });
      }
      if (url === "/master/categories") {
        return Promise.resolve({
          data: {
            status: "success",
            data: [{ category_id: 1, category_name: "Electronics" }]
          }
        });
      }
      return Promise.resolve({ data: { status: "success", data: [] } });
    });

    render(<MasterDataPage />);

    // Verify it transitions out of loading state and displays product records
    await waitFor(() => {
      expect(screen.getByText("Test Led Widescreen")).toBeInTheDocument();
      expect(screen.getByText("PRD-TEST-001")).toBeInTheDocument();
      expect(screen.getAllByText("Electronics")[0]).toBeInTheDocument();
      expect(screen.getByText("45")).toBeInTheDocument();
    });
  });
});
