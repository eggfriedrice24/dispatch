import { ipc } from "@/renderer/lib/app/ipc";

export async function openExternal(url: string): Promise<void> {
  await ipc("app.openExternal", { url });
}
