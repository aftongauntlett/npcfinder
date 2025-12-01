/**
 * Tests for metadata form helpers
 *
 * These pure functions map URL metadata to form state patches
 */

import { describe, it, expect } from "vitest";
import {
  applyJobMetadataToForm,
  applyRecipeMetadataToForm,
  applyGenericMetadataToForm,
} from "../src/utils/metadataFormHelpers";
import type { UrlMetadata } from "../src/hooks/useUrlMetadata";
describe("applyJobMetadataToForm", () => {
  it("should extract all job fields when present", () => {
    const metadata: UrlMetadata = {
      kind: "job",
      url: "https://example.greenhouse.io/jobs/123",
      title: "Senior Engineer - Acme Corp",
      jobPosting: {
        company: "Acme Corp",
        position: "Senior Engineer",
        salary: "$120,000 - $160,000",
        location: "San Francisco, CA",
        employmentType: "Full-time",
      },
    };

    const result = applyJobMetadataToForm(
      metadata,
      "https://example.greenhouse.io/jobs/123"
    );

    expect(result.title).toBe("Senior Engineer");
    expect(result.companyName).toBe("Acme Corp");
    expect(result.position).toBe("Senior Engineer");
    expect(result.salaryRange).toBe("$120,000 - $160,000");
    expect(result.location).toBe("San Francisco, CA");
    expect(result.employmentType).toBe("Full-time");
    expect(result.companyUrl).toBe("https://example.greenhouse.io/jobs/123");
    expect(result.extractedFields).toBe(5);
    expect(result.fieldNames).toEqual([
      "position",
      "company",
      "salary",
      "location",
      "type",
    ]);
  });

  it("should handle partial job data", () => {
    const metadata: UrlMetadata = {
      kind: "job",
      url: "https://jobs.lever.co/example/456",
      jobPosting: {
        company: "Example Inc",
        position: "Product Manager",
      },
    };

    const result = applyJobMetadataToForm(
      metadata,
      "https://jobs.lever.co/example/456"
    );

    expect(result.title).toBe("Product Manager");
    expect(result.companyName).toBe("Example Inc");
    expect(result.position).toBe("Product Manager");
    expect(result.salaryRange).toBeUndefined();
    expect(result.location).toBeUndefined();
    expect(result.extractedFields).toBe(2);
    expect(result.fieldNames).toEqual(["position", "company"]);
  });

  it("should return empty patch when jobPosting is missing", () => {
    const metadata: UrlMetadata = {
      kind: "generic",
      url: "https://example.com",
      title: "Some Page",
    };

    const result = applyJobMetadataToForm(metadata, "https://example.com");

    expect(result.extractedFields).toBe(0);
    expect(result.fieldNames).toEqual([]);
    expect(result.title).toBeUndefined();
    expect(result.companyName).toBeUndefined();
  });
});

describe("applyRecipeMetadataToForm", () => {
  it("should extract all recipe fields when present", () => {
    const metadata: UrlMetadata = {
      kind: "recipe",
      url: "https://example.com/chocolate-cake",
      title: "Best Chocolate Cake",
      recipe: {
        name: "Best Chocolate Cake",
        description: "A delicious chocolate cake recipe",
        ingredients: ["2 cups flour", "1 cup sugar", "3 eggs"],
        instructions: [
          "Mix dry ingredients",
          "Add wet ingredients",
          "Bake at 350F",
        ],
        prepTime: "15 minutes",
        cookTime: "30 minutes",
        totalTime: "45 minutes",
        servings: "8",
      },
    };

    const result = applyRecipeMetadataToForm(
      metadata,
      "https://example.com/chocolate-cake"
    );

    expect(result.title).toBe("Best Chocolate Cake");
    expect(result.recipeName).toBe("Best Chocolate Cake");
    expect(result.description).toBe("A delicious chocolate cake recipe");
    expect(result.ingredients).toBe("2 cups flour\n1 cup sugar\n3 eggs");
    expect(result.instructions).toBe(
      "Mix dry ingredients\nAdd wet ingredients\nBake at 350F"
    );
    expect(result.prepTime).toBe("15 minutes");
    expect(result.cookTime).toBe("30 minutes");
    expect(result.totalTime).toBe("45 minutes");
    expect(result.servings).toBe("8");
    expect(result.recipeUrl).toBe("https://example.com/chocolate-cake");
    expect(result.extractedFields).toBe(4);
    expect(result.fieldNames).toContain("name");
    expect(result.fieldNames).toContain("description");
    expect(result.fieldNames).toContain("ingredients");
    expect(result.fieldNames).toContain("instructions");
  });

  it("should handle minimal recipe data", () => {
    const metadata: UrlMetadata = {
      kind: "recipe",
      url: "https://example.com/simple-recipe",
      recipe: {
        name: "Simple Recipe",
      },
    };

    const result = applyRecipeMetadataToForm(
      metadata,
      "https://example.com/simple-recipe"
    );

    expect(result.title).toBe("Simple Recipe");
    expect(result.recipeName).toBe("Simple Recipe");
    expect(result.extractedFields).toBe(1);
    expect(result.fieldNames).toEqual(["name"]);
    expect(result.ingredients).toBeUndefined();
  });

  it("should return empty patch when recipe is missing", () => {
    const metadata: UrlMetadata = {
      kind: "generic",
      url: "https://example.com",
      title: "Some Page",
    };

    const result = applyRecipeMetadataToForm(metadata, "https://example.com");

    expect(result.extractedFields).toBe(0);
    expect(result.fieldNames).toEqual([]);
    expect(result.title).toBeUndefined();
  });
});

describe("applyGenericMetadataToForm", () => {
  it("should extract title and description when fields are empty", () => {
    const metadata: UrlMetadata = {
      kind: "generic",
      url: "https://example.com/article",
      title: "Interesting Article",
      description: "This is a very interesting article about something.",
    };

    const result = applyGenericMetadataToForm(metadata, "", "");

    expect(result.title).toBe("Interesting Article");
    expect(result.description).toBe(
      "This is a very interesting article about something."
    );
    expect(result.extractedFields).toBe(2);
    expect(result.fieldNames).toEqual(["title", "description"]);
  });

  it("should not overwrite existing title", () => {
    const metadata: UrlMetadata = {
      kind: "generic",
      url: "https://example.com/article",
      title: "Article Title",
      description: "Article description",
    };

    const result = applyGenericMetadataToForm(metadata, "Existing Title", "");

    expect(result.title).toBeUndefined();
    expect(result.description).toBe("Article description");
    expect(result.extractedFields).toBe(1);
    expect(result.fieldNames).toEqual(["description"]);
  });

  it("should not overwrite existing description", () => {
    const metadata: UrlMetadata = {
      kind: "generic",
      url: "https://example.com/article",
      title: "Article Title",
      description: "Article description",
    };

    const result = applyGenericMetadataToForm(
      metadata,
      "",
      "Existing description"
    );

    expect(result.title).toBe("Article Title");
    expect(result.description).toBeUndefined();
    expect(result.extractedFields).toBe(1);
    expect(result.fieldNames).toEqual(["title"]);
  });

  it("should return empty patch when no metadata is available", () => {
    const metadata: UrlMetadata = {
      kind: "generic",
      url: "https://example.com",
    };

    const result = applyGenericMetadataToForm(metadata, "", "");

    expect(result.extractedFields).toBe(0);
    expect(result.fieldNames).toEqual([]);
  });
});

describe("LinkedIn job extraction", () => {
  it("should correctly map LinkedIn job posting", () => {
    const metadata: UrlMetadata = {
      kind: "job",
      url: "https://www.linkedin.com/jobs/view/123456",
      title: "Software Engineer - LinkedIn",
      jobPosting: {
        company: "LinkedIn",
        position: "Software Engineer",
        location: "Remote - United States",
        employmentType: "Full-time",
      },
    };

    const result = applyJobMetadataToForm(
      metadata,
      "https://www.linkedin.com/jobs/view/123456"
    );

    expect(result.companyName).toBe("LinkedIn");
    expect(result.position).toBe("Software Engineer");
    expect(result.location).toBe("Remote - United States");
    expect(result.employmentType).toBe("Full-time");
    expect(result.extractedFields).toBe(4);
  });
});

describe("Indeed job extraction", () => {
  it("should correctly map Indeed job posting with salary", () => {
    const metadata: UrlMetadata = {
      kind: "job",
      url: "https://www.indeed.com/viewjob?jk=abc123",
      title: "Data Analyst - Tech Company - New York, NY",
      jobPosting: {
        company: "Tech Company",
        position: "Data Analyst",
        location: "New York, NY",
        salary: "$80,000 - $100,000 per year",
      },
    };

    const result = applyJobMetadataToForm(
      metadata,
      "https://www.indeed.com/viewjob?jk=abc123"
    );

    expect(result.companyName).toBe("Tech Company");
    expect(result.position).toBe("Data Analyst");
    expect(result.location).toBe("New York, NY");
    expect(result.salaryRange).toBe("$80,000 - $100,000 per year");
    expect(result.extractedFields).toBe(4);
  });
});
