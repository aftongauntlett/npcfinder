import { describe, it, expect } from "vitest";
import {
  DEFAULT_LOCATION,
  WEATHER_REFRESH_INTERVAL,
  VIEWS,
  ViewName,
} from "../src/utils/constants";

describe("constants", () => {
  describe("DEFAULT_LOCATION", () => {
    it("has correct location data for Ashburn, VA", () => {
      expect(DEFAULT_LOCATION.name).toBe("Ashburn, VA");
      expect(DEFAULT_LOCATION.latitude).toBe(39.0438);
      expect(DEFAULT_LOCATION.longitude).toBe(-77.4874);
    });

    it("is an object with all required properties", () => {
      expect(DEFAULT_LOCATION).toHaveProperty("name");
      expect(DEFAULT_LOCATION).toHaveProperty("latitude");
      expect(DEFAULT_LOCATION).toHaveProperty("longitude");
    });
  });

  describe("WEATHER_REFRESH_INTERVAL", () => {
    it("is 10 minutes in milliseconds", () => {
      const tenMinutesInMs = 10 * 60 * 1000;
      expect(WEATHER_REFRESH_INTERVAL).toBe(tenMinutesInMs);
      expect(WEATHER_REFRESH_INTERVAL).toBe(600000);
    });
  });

  describe("VIEWS", () => {
    it("contains all expected view names", () => {
      expect(VIEWS.HOME).toBe("home");
      expect(VIEWS.FITNESS).toBe("fitness");
      expect(VIEWS.MOVIES_TV).toBe("movies-tv");
      expect(VIEWS.SETTINGS).toBe("settings");
      expect(VIEWS.TEST).toBe("test");
    });

    it("has correct number of views", () => {
      expect(Object.keys(VIEWS)).toHaveLength(5);
    });
  });

  describe("ViewName type", () => {
    it("accepts valid view names", () => {
      const validView: ViewName = "home";
      expect(validView).toBe("home");
    });
  });
});
