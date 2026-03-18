/**
 * @file ide-adapters/types.ts
 * @description IdeAdapter interface — the contract every IDE adapter must implement.
 *
 * When adding support for a new capability that behaves differently per IDE,
 * add an optional method here and implement it in each adapter file.
 */

export interface IdeAdapter {
  /** Human-readable IDE name for logging. */
  readonly name: string;

  /**
   * Register the bundled MCP server with the IDE so AI assistants can use
   * Jira tools. Called after credentials are validated in step-0.
   *
   * @param credPath  Absolute path to the mcp-credentials.json file.
   * @param serverPath  Absolute path to the compiled out/mcp/mcp/server.js.
   */
  registerMcp(credPath: string, serverPath: string): Promise<void>;

  /**
   * Remove the MCP server registration from the IDE.
   * Called when the user resets credentials.
   */
  unregisterMcp(): Promise<void>;

  // Future capabilities (add method signatures here as needed):
  // injectPrompt?(prompt: string): Promise<void>;
}
