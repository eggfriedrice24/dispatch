import type { IpcApi, IpcMethod } from "../../shared/ipc";

export type Handler<M extends IpcMethod> = (
  args: IpcApi[M]["args"],
) => Promise<IpcApi[M]["result"]> | IpcApi[M]["result"];

export type HandlerMap = { [M in IpcMethod]: Handler<M> };
