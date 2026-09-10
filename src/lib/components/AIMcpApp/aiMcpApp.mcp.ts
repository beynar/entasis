export const aiMcpAppDescription = `
# AIMcpApp

Renders an official MCP App resource through AppBridge and a separate-origin sandbox proxy.

Security defaults:

- The sandbox URL must be an absolute HTTP(S) URL on a different origin from the host.
- Resource browser permissions are denied unless named in permissionPolicy.allowedPermissions.
- App-originated server tool calls are disabled unless both appToolPolicy.allowedTools and onAppToolCall are provided.
- AppBridge uses manual handlers; the MCP Client is never exposed through automatic request forwarding.
- Resources that declare official domain metadata require resolveSandboxUrl so the host can map that domain to an isolated sandbox origin.
- Request callbacks receive the source tool call and the bridge RequestHandlerExtra, including its AbortSignal.
- Message and model-context content are rejected when they exceed the explicitly advertised modalities.
- Fullscreen and picture-in-picture modes are advertised only when onDisplayMode exists; handler results must be available to both host and app.

Lifecycle:

- Pass an AIMcpToolCall and replace it immutably while keeping its id, name, and resource URI stable.
- Streaming calls emit zero or more partial-input notifications. The first non-streaming update emits complete input exactly once.
- A result or cancellation is emitted only after complete input, and each terminal outcome is emitted once.
- Resource, sandbox, initialization, runtime, teardown, and closed states remain visible and can be replaced with loading, error, closed, and children slots.

\`\`\`svelte
<AIMcpApp
  {tool}
  aria-label="Interactive weather app"
  host={{
    client,
    hostInfo: { name: 'My host', version: '1.0.0' },
    sandboxUrl: 'https://sandbox.example.com/mcp',
    permissionPolicy: { allowedPermissions: [] },
    appToolPolicy: { allowedTools: ['refresh-weather'] },
    onAppToolCall: ({ params, tool, extra }) =>
      runConversationTool(params, tool, { signal: extra.signal })
  }}
/>
\`\`\`

Deploy createAIMcpSandboxResponse on the separate sandbox origin with an explicit allowedHostOrigins list. Do not return plausible fallback resources or tool results when resolution or authorization fails.
`;
