import { useNavigate } from 'react-router-dom';
import { Cog6ToothIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { ContextMenu, useContextMenu, MenuItem } from '../ui';
import type { WorkspaceSummary } from '@feather/api-client';

interface WorkspaceContextMenuProps {
  workspace: WorkspaceSummary;
  children: (onContextMenu: (e: React.MouseEvent) => void, isMenuOpen: boolean) => React.ReactNode;
}

export function WorkspaceContextMenu({ workspace, children }: WorkspaceContextMenuProps) {
  const { isOpen, setIsOpen, position, onContextMenu } = useContextMenu();
  const navigate = useNavigate();

  return (
    <>
      {children(onContextMenu, isOpen)}
      <ContextMenu isOpen={isOpen} onOpenChange={setIsOpen} position={position}>
        <MenuItem
          onAction={() => navigate(`/workspaces/${workspace.id}/settings`)}
          icon={<Cog6ToothIcon className="h-4 w-4" />}
        >
          Workspace Settings
        </MenuItem>
        <MenuItem
          onAction={() => navigate(`/workspaces/${workspace.id}/invite`)}
          icon={<UserPlusIcon className="h-4 w-4" />}
        >
          Invite People
        </MenuItem>
      </ContextMenu>
    </>
  );
}
