# Changelog

## 1.0.0 (2026-11-17)

Initial public release.

- Self-contained dsh plugin: the full ppt-master skill tree (upstream 6.9.0
  plus two upstream bugfix commits) vendored under `skills/ppt-master`.
- Local fix on top of upstream: the qwen image backend whitelist accepts
  `qwen-image-3.0` (in addition to qwen-image-2.0-pro).
- Registers the `ppt-master` skill via `ctx.skills.register` with a
  directory resourceBase, so SKILL_DIR-relative paths resolve inside the
  package. No tools, no config surface, zero npm dependencies.
