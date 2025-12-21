import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_WORKFLOWS_DIR = path.resolve(process.cwd(), '.windsurf', 'workflows');

const isMarkdown = (filePath) => filePath.toLowerCase().endsWith('.md');

const readDirRecursive = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await readDirRecursive(full)));
    } else {
      out.push(full);
    }
  }
  return out;
};

const extractFrontmatter = (content) => {
  const lines = String(content).replace(/\r\n/g, '\n').split('\n');
  if (lines.length === 0 || lines[0].trim() !== '---') {
    return { ok: false, error: 'Falta frontmatter (---) al inicio' };
  }
  const endIndex = lines.slice(1).findIndex((line) => line.trim() === '---');
  if (endIndex === -1) {
    return { ok: false, error: 'Frontmatter sin cierre (---)' };
  }
  const fmEnd = endIndex + 1;
  const frontmatter = lines.slice(1, fmEnd).join('\n');
  const body = lines.slice(fmEnd + 1).join('\n');
  return { ok: true, frontmatter, body };
};

const parseDescription = (frontmatter) => {
  const match = /^description\s*:\s*(.+)\s*$/m.exec(frontmatter);
  if (!match) return { ok: false, error: 'Falta la clave description en el frontmatter' };

  let value = String(match[1] ?? '').trim();
  if (!value) return { ok: false, error: 'description está vacío' };

  // Quitar comillas simples/dobles si existen
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }

  if (!value) return { ok: false, error: 'description está vacío tras limpiar comillas' };
  return { ok: true, value };
};

const validateWorkflow = (filePath, content) => {
  const errors = [];

  const extracted = extractFrontmatter(content);
  if (!extracted.ok) {
    errors.push(extracted.error);
    return { ok: false, errors };
  }

  const desc = parseDescription(extracted.frontmatter);
  if (!desc.ok) {
    errors.push(desc.error);
  }

  const body = String(extracted.body || '');
  if (!body.trim()) {
    errors.push('El workflow no tiene contenido después del frontmatter');
  }

  return { ok: errors.length === 0, errors, description: desc.ok ? desc.value : null };
};

const parseArgs = (argv) => {
  const args = { dir: DEFAULT_WORKFLOWS_DIR, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir' && argv[i + 1]) {
      args.dir = path.resolve(process.cwd(), argv[i + 1]);
      i++;
    } else if (a === '--json') {
      args.json = true;
    }
  }
  return args;
};

const main = async () => {
  const { dir, json } = parseArgs(process.argv.slice(2));

  let files = [];
  try {
    files = await readDirRecursive(dir);
  } catch (err) {
    console.error(`[validateWorkflows] No se pudo leer el directorio: ${dir}`);
    console.error(err?.message || err);
    process.exit(2);
  }

  const markdownFiles = files.filter(isMarkdown);

  const results = [];
  for (const filePath of markdownFiles) {
    const content = await fs.readFile(filePath, 'utf8');
    const res = validateWorkflow(filePath, content);
    results.push({ filePath, ...res });
  }

  const failed = results.filter((r) => !r.ok);
  const passed = results.filter((r) => r.ok);

  if (json) {
    console.log(JSON.stringify({
      dir,
      total: results.length,
      passed: passed.length,
      failed: failed.length,
      results,
    }, null, 2));
  } else {
    console.log(`[validateWorkflows] Directorio: ${dir}`);
    console.log(`[validateWorkflows] Total workflows: ${results.length}`);
    console.log(`[validateWorkflows] OK: ${passed.length}`);
    console.log(`[validateWorkflows] FAIL: ${failed.length}`);

    if (failed.length) {
      console.log('');
      console.log('Workflows con errores:');
      for (const item of failed) {
        console.log(`- ${path.relative(process.cwd(), item.filePath)}`);
        for (const e of item.errors) {
          console.log(`  - ${e}`);
        }
      }
    }
  }

  process.exit(failed.length ? 1 : 0);
};

main();
