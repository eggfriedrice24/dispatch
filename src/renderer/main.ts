import "./style.css";

function render(): void {
  const root = document.querySelector("#app");
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="flex min-h-screen flex-col items-center justify-center bg-neutral-950 text-white">
      <div class="flex flex-col items-center gap-6">
        <div class="flex items-center gap-3">
          <span class="text-5xl font-bold tracking-tight text-white">Dispatch</span>
        </div>
        <p class="max-w-md text-center text-lg leading-relaxed text-neutral-400">
          Electron + Vite + Tailwind CSS
        </p>
        <div class="mt-4 flex gap-3">
          <a
            href="https://vitejs.dev"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            Vite 8
          </a>
          <a
            href="https://www.electronjs.org"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            Electron 41
          </a>
          <a
            href="https://tailwindcss.com"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            Tailwind 4
          </a>
        </div>
        <p class="mt-8 text-xs text-neutral-600">
          Edit <code class="rounded bg-white/5 px-1.5 py-0.5 font-mono text-neutral-400">src/renderer/main.ts</code> to get started
        </p>
      </div>
    </div>
  `;
}

render();
