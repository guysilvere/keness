import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';
import type { Registry, RegistryEntry } from '../types.js';
import { kenessRegistryPath } from '../paths.js';

const REGISTRY_VERSION = '1' as const;

function empty(): Registry {
  return { version: REGISTRY_VERSION, entries: [] };
}

export function loadRegistry(registryPath?: string): Registry {
  const path = registryPath ?? kenessRegistryPath();
  if (!existsSync(path)) return empty();
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Registry;
  } catch {
    return empty();
  }
}

export function saveRegistry(registry: Registry, registryPath?: string): void {
  const path = registryPath ?? kenessRegistryPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(registry, null, 2) + '\n', 'utf8');
}

export function getEntry(
  registry: Registry,
  id: string,
): RegistryEntry | undefined {
  return registry.entries.find((e) => e.id === id);
}

export function findByName(
  registry: Registry,
  name: string,
): RegistryEntry | undefined {
  return registry.entries.find((e) => e.name === name);
}

export function addEntry(registry: Registry, entry: RegistryEntry): Registry {
  return { ...registry, entries: [...registry.entries, entry] };
}

export function updateEntry(
  registry: Registry,
  id: string,
  patch: Partial<Omit<RegistryEntry, 'id' | 'createdAt'>>,
): Registry {
  return {
    ...registry,
    entries: registry.entries.map((e) =>
      e.id === id
        ? { ...e, ...patch, updatedAt: new Date().toISOString() }
        : e,
    ),
  };
}

export function removeEntry(registry: Registry, id: string): Registry {
  return {
    ...registry,
    entries: registry.entries.filter((e) => e.id !== id),
  };
}

export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}
