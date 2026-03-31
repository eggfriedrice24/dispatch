import type {
  EnvStatus,
  GhAccount,
  GhAvatarLookup,
  GhRepoAccount,
  GhUser,
  RepoInfo,
  Workspace,
} from "../../ipc";

export interface EnvironmentIpcApi {
  "env.check": { args: void; result: EnvStatus };
  "env.user": { args: void; result: GhUser | null };
  "env.accounts": { args: void; result: GhAccount[] };
  "env.repoAccount": { args: { cwd: string }; result: GhRepoAccount | null };
  "env.avatarUrl": {
    args: { cwd: string; login: string; host: string };
    result: GhAvatarLookup | null;
  };
  "env.switchAccount": { args: { host: string; login: string }; result: void };

  "repo.info": { args: { cwd: string }; result: RepoInfo };

  "workspace.list": { args: void; result: Workspace[] };
  "workspace.add": { args: { path: string }; result: { path: string; name: string } };
  "workspace.remove": { args: { id: number }; result: void };
  "workspace.active": { args: void; result: string | null };
  "workspace.setActive": { args: { path: string }; result: void };
  "workspace.pickFolder": { args: void; result: string | null };
}
