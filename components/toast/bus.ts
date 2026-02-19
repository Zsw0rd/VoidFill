export type ToastItem = { id: string; title: string; message?: string; ttlMs: number };

type Listener = (t: ToastItem) => void;

class ToastBus {
  private listeners = new Set<Listener>();
  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit(title: string, message?: string, ttlMs = 3200) {
    const t: ToastItem = { id: crypto.randomUUID(), title, message, ttlMs };
    this.listeners.forEach((fn) => fn(t));
  }
}

export const toastBus = new ToastBus();

export function toast(title: string, message?: string) {
  toastBus.emit(title, message);
}
