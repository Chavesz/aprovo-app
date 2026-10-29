import { useEffect, useState } from 'react';
import type { Resposta } from './types';

function ler<T>(chave: string, inicial: T): T {
  try {
    const v = localStorage.getItem(chave);
    return v ? (JSON.parse(v) as T) : inicial;
  } catch {
    return inicial;
  }
}

/** Estado persistido em localStorage, com falha silenciosa (modo privado etc.). */
export function usePersist<T>(chave: string, inicial: T) {
  const [v, setV] = useState<T>(() => ler(chave, inicial));
  useEffect(() => {
    try {
      localStorage.setItem(chave, JSON.stringify(v));
    } catch {
      /* sem armazenamento: segue só em memória */
    }
  }, [chave, v]);
  return [v, setV] as const;
}

export type Historico = Resposta[];
