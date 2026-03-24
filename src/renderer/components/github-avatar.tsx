import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { UserRound } from "lucide-react";

import { buildGitHubAvatarUrl, resizeGitHubAvatarUrl } from "../lib/github-avatar";
import { ipc } from "../lib/ipc";
import { useWorkspace } from "../lib/workspace-context";

interface GitHubAvatarProps {
  login: string;
  size?: number;
  className?: string;
  avatarUrl?: string;
  cwd?: string;
}

export function GitHubAvatar({
  login,
  size = 20,
  className,
  avatarUrl,
  cwd,
}: GitHubAvatarProps): React.ReactElement {
  const { cwd: workspaceCwd } = useWorkspace();
  const iconSize = Math.max(Math.round(size * 0.48), 10);
  const resolvedCwd = cwd ?? workspaceCwd;
  const repoAccountQuery = useQuery({
    queryKey: ["env", "repoAccount", resolvedCwd],
    queryFn: () => ipc("env.repoAccount", { cwd: resolvedCwd }),
    staleTime: 300_000,
    retry: 1,
    enabled: !avatarUrl && Boolean(resolvedCwd),
  });
  const src = avatarUrl
    ? resizeGitHubAvatarUrl(avatarUrl, size * 2)
    : buildGitHubAvatarUrl({
        login,
        size: size * 2,
        host: repoAccountQuery.data?.host ?? "github.com",
      });

  return (
    <Avatar
      className={cn("bg-bg-raised shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <AvatarImage
        src={src}
        alt={login}
        loading="eager"
        referrerPolicy="no-referrer"
      />
      <AvatarFallback className="text-accent-text bg-[linear-gradient(135deg,rgba(212,136,58,0.18),rgba(124,90,42,0.72))]">
        <UserRound
          size={iconSize}
          strokeWidth={1.75}
        />
      </AvatarFallback>
    </Avatar>
  );
}
