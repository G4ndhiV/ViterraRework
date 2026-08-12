import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

// Mock global de fetch para evitar peticiones reales en tests unitarios
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({}),
  text: async () => "",
  blob: async () => new Blob(),
  arrayBuffer: async () => new ArrayBuffer(0),
  headers: new Headers(),
});

// Mock de localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock de sessionStorage
Object.defineProperty(window, "sessionStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock de window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ─── Mock de window.ResizeObserver ───────────────────────────────────────────
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = MockResizeObserver as any;
window.ResizeObserver = MockResizeObserver as any;

// ─── Mock de window.IntersectionObserver ─────────────────────────────────────
class MockIntersectionObserver {
  root = null;
  rootMargin = "";
  thresholds = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}
global.IntersectionObserver = MockIntersectionObserver as any;
window.IntersectionObserver = MockIntersectionObserver as any;

// ─── Suprimir warnings esperados ──────────────────────────────────────────────
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("Warning: ReactDOM.render is no longer supported") ||
      args[0].includes("act(...)") ||
      args[0].includes("not wrapped in act"))
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Reset de mocks entre tests
afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});
