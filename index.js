/**
 * dsh-ppt-master-local — registers the vendored ppt-master skill as a DSH skill.
 *
 * The skill tree ships inside this package (`skills/ppt-master`), so the
 * package is self-contained: any dsh host can install it without a sibling
 * checkout. The skill body is re-read from disk on every apply, and the
 * skill's resourceBase points at the vendored directory, so SKILL_DIR-relative
 * paths resolve inside the package. No tools, no config surface: image
 * generation is configured through a .env file that image_gen.py discovers
 * next to the skill (see README).
 * @module dsh-ppt-master-local
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'dsh-ppt-master-local'
export const inject = ['skills']

/** Parse the YAML frontmatter subset used by SKILL.md (scalars + `>` blocks). */
function parseFrontmatter(raw) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  if (lines[0] !== '---') return { data: {}, body: raw }
  let end = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') { end = i; break }
  }
  if (end < 0) return { data: {}, body: raw }
  const data = {}
  let key = null
  let mode = null
  for (let i = 1; i < end; i++) {
    const line = lines[i]
    if (mode === 'block') {
      if (/^[ \t]/.test(line) || line.trim() === '') {
        data[key].push(line.trim())
        continue
      }
      mode = null
    }
    const m = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(line)
    if (!m) continue
    key = m[1]
    const value = m[2]
    if (value === '>' || value === '|' || value === '>-' || value === '|-') {
      data[key] = []
      mode = 'block'
    } else if (value === '') {
      // Nested object follows; its indented lines never match the scalar
      // regex below, so nothing more to do for this key.
      data[key] = null
    } else {
      data[key] = stripQuotes(value)
    }
  }
  for (const k of Object.keys(data)) {
    if (Array.isArray(data[k])) data[k] = data[k].filter((s) => s !== '').join(' ')
  }
  return { data, body: lines.slice(end + 1).join('\n') }
}

function stripQuotes(value) {
  if (value.length >= 2 && ((value[0] === '"' && value.endsWith('"')) || (value[0] === "'" && value.endsWith("'")))) {
    return value.slice(1, -1)
  }
  return value
}

export function apply(ctx) {
  const pluginDir = dirname(fileURLToPath(import.meta.url))
  const override = process.env.DSH_PPT_MASTER_SKILL_DIR
  // Explicit override first, then the vendored copy (self-contained package),
  // then the sibling checkout (development layout).
  const candidates = [
    ...(override ? [resolve(override)] : []),
    resolve(pluginDir, 'skills', 'ppt-master'),
    resolve(pluginDir, '..', 'ppt-master', 'skills', 'ppt-master'),
  ]
  let skillDir = null
  for (const candidate of candidates) {
    try {
      readFileSync(resolve(candidate, 'SKILL.md'))
      skillDir = candidate
      break
    } catch { /* try the next candidate */ }
  }
  if (skillDir === null) {
    ctx.logger.error(`dsh-ppt-master-local: no ppt-master skill directory found; tried: ${candidates.join(' ; ')}`)
    return
  }
  const skillMdPath = resolve(skillDir, 'SKILL.md')

  let raw
  try {
    raw = readFileSync(skillMdPath, 'utf8')
  } catch (error) {
    ctx.logger.error(`dsh-ppt-master-local: cannot read ${skillMdPath}: ${error.message}`)
    return
  }
  const { data, body } = parseFrontmatter(raw)
  if (!data.name || !data.description) {
    ctx.logger.error(`dsh-ppt-master-local: ${skillMdPath} frontmatter lacks name/description`)
    return
  }

  ctx.skills.register({
    name: data.name,
    description: data.description,
    source: 'runtime',
    ...(data.whenToUse ? { whenToUse: data.whenToUse } : {}),
    content: body.trim(),
    path: skillMdPath,
    resourceBase: { kind: 'directory', path: skillDir },
  })
  ctx.logger.info(`dsh-ppt-master-local: registered skill "${data.name}" from ${skillDir}`)
}
