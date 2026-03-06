import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui';
import { useAuth } from '../../hooks';
import { useLeaveAndNavigate } from '../../hooks/useWorkspaces';
import type { WorkspaceSummary } from '@enzyme/api-client';

interface BanScreenProps {
  workspace: WorkspaceSummary;
}

export function BanScreen({ workspace }: BanScreenProps) {
  const navigate = useNavigate();
  const { workspaces } = useAuth();
  const { leave, isPending } = useLeaveAndNavigate(workspaces);
  if (!workspace.ban) return null;
  const ban = workspace.ban;

  const otherWorkspaces = workspaces?.filter((ws) => ws.id !== workspace.id && !ws.ban) ?? [];

  const formattedExpiry = ban.expires_at
    ? new Date(ban.expires_at).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="flex flex-1 items-center justify-center bg-white dark:bg-gray-900">
      <div className="flex max-w-md flex-col items-center px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <ShieldExclamationIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          You have been banned from {workspace.name}
        </h1>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {formattedExpiry ? `Expires: ${formattedExpiry}` : 'This ban is permanent'}
        </p>

        <div className="mt-6 flex w-full flex-col gap-3">
          {otherWorkspaces.length > 0 && (
            <Button
              onPress={() => navigate(`/workspaces/${otherWorkspaces[0].id}`)}
              className="w-full"
            >
              Switch to {otherWorkspaces[0].name}
            </Button>
          )}
          <Button
            variant="secondary"
            onPress={() => leave(workspace.id)}
            isLoading={isPending}
            className="w-full"
          >
            Leave Workspace
          </Button>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Remove this workspace from your list
          </p>
        </div>
      </div>
    </div>
  );
}
