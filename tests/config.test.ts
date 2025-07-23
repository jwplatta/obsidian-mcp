import { Config } from "../src/config.js";

describe("Config", () => {
  describe("Config class", () => {
    test("should be a singleton", () => {
      const config1 = Config.getInstance();
      const config2 = Config.getInstance();
      
      expect(config1).toBe(config2);
    });

    test("should have default config paths", () => {
      const config = Config.getInstance();
      
      expect(config.configDir).toContain("obsidian-mcp");
      expect(config.configFile).toContain("vaults.json");
    });

    test("should allow setting custom config file path", () => {
      const config = Config.getInstance();
      const customPath = "/tmp/custom-vaults.json";
      
      config.setConfigFile(customPath);
      
      expect(config.configFile).toBe(customPath);
    });
  });
});