import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { SearchBarCatalogPriceRange } from "../../../app/components/SearchBarCatalogPriceRange";

describe("SearchBarCatalogPriceRange component", () => {
  it("should render price range input with min and max bounds", () => {
    const onChange = vi.fn();

    render(
      <SearchBarCatalogPriceRange
        variant="default"
        prices={[1000000, 5000000, 10000000]}
        minPrice="1000000"
        maxPrice="5000000"
        onChange={onChange}
      />
    );

    expect(screen.getByRole("slider", { name: /Minimum/i })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /Maximum/i })).toBeInTheDocument();
  });
});
