"use client";

import {
  useCallback,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";

const cache = new Map<string, { raw: string | null; value: unknown }>();
const listeners = new Map<string, Set<() => void>>();

function emit(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function subscribeToKey(key: string, onChange: () => void) {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(onChange);

  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) {
      cache.delete(key);
      emit(key);
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    set.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function read<T>(key: string, fallback: T, parse: (raw: string) => T): T {
  const raw = localStorage.getItem(key);
  const cached = cache.get(key);
  if (cached && cached.raw === raw) {
    return cached.value as T;
  }

  let value = fallback;
  if (raw !== null) {
    try {
      value = parse(raw);
    } catch {
      localStorage.removeItem(key);
    }
  }

  cache.set(key, { raw, value });
  return value;
}

export function useLocalStorageState<T>(
  key: string,
  fallback: T,
  parse: (raw: string) => T = JSON.parse,
  serialize: (value: T) => string = JSON.stringify
): [T, Dispatch<SetStateAction<T>>] {
  const subscribe = useCallback(
    (onChange: () => void) => subscribeToKey(key, onChange),
    [key]
  );
  const getSnapshot = useCallback(
    () => read(key, fallback, parse),
    [key, fallback, parse]
  );
  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  const value = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    (action) => {
      const current = read(key, fallback, parse);
      const next =
        typeof action === "function"
          ? (action as (prev: T) => T)(current)
          : action;
      const raw = serialize(next);
      localStorage.setItem(key, raw);
      cache.set(key, { raw, value: next });
      emit(key);
    },
    [key, fallback, parse, serialize]
  );

  return [value, setValue];
}
