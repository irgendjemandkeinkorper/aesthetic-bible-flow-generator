# Copilot CLI bridge spike

Status: negative result; no bridge endpoint ships.

## Goal and safety boundary

Issue #33 asked whether the local Express development server could invoke an installed `copilot` or `gh copilot` executable to produce a completion. Any implementation would have needed to remain localhost-only and use `child_process.execFile` or `spawn` with a fixed executable plus an argument array, strict prompt length validation, a timeout, and caps on stdout and stderr. Shell execution, interpolated command strings, and exposure through the static GitHub Pages build were explicitly out of scope.

## What was tested

On 2026-08-11, this environment contained the standalone Copilot CLI at `/home/adamjroder/.npm-global/bin/copilot`. Its help output documented `-p`/`--prompt` for non-interactive use and `--silent` for script-oriented output.

A minimal, non-interactive prompt invocation was then attempted with all available tools disabled:

```text
copilot -p "Reply with exactly: bridge-ok" --silent --available-tools=
```

The process exited with status 1 before producing a completion because the available authentication token could not be validated against GitHub. The CLI suggested re-authentication or supplying a GitHub token. No successful completion invocation could therefore be demonstrated in this environment.

## Decision

No Express route, child-process wrapper, or production code was added. Shipping a wrapper based only on CLI help would leave authentication, output behavior, permissions, and failure modes unverified. It could also expose a powerful local agent process through HTTP if a future binding or proxy configuration changed.

This preserves the existing Express fallback and avoids a half-safe bridge. Consequently, child-process unit tests are not applicable: there is no wrapper to test.

## Requirements before reconsideration

A future spike should begin in an authenticated, network-enabled local environment and must first demonstrate a completion with an empty tool allowlist. Only then should it add a development-only route that:

- refuses requests unless both the listening socket and request address are loopback;
- accepts a single bounded prompt with a conservative character and byte limit;
- invokes an explicitly resolved executable using `execFile`/`spawn` and an argument array, never a shell;
- disables CLI tools, repository writes, URL access, session persistence, and inherited secrets where the CLI supports it;
- terminates the process group on a short timeout;
- enforces independent stdout and stderr byte caps while streaming, rather than buffering unbounded output;
- returns generic client errors and logs only redacted operational metadata; and
- has unit tests that mock the child process and prove raw input never enters an executable or command string.
