import { Cog6ToothIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { ContextMenu, useContextMenu, MenuItem } from '../ui';

interface WorkspaceContextMenuProps {
  onOpenWorkspaceSettings: () => void;
  onOpenInvite: () => void;
  children: (onContextMenu: (e: React.MouseEvent) => void, isMenuOpen: boolean) => React.ReactNode;
}

export function WorkspaceContextMenu({
  onOpenWorkspaceSettings,
  onOpenInvite,
  children,
}: WorkspaceContextMenuProps) {
  const { isOpen, setIsOpen, position, onContextMenu } = useContextMenu();

  return (
    <>
      {children(onContextMenu, isOpen)}
      <ContextMenu isOpen={isOpen} onOpenChange={setIsOpen} position={position}>
        <MenuItem onAction={onOpenWorkspaceSettings} icon={<Cog6ToothIcon className="h-4 w-4" />}>
          Workspace Settings
        </MenuItem>
        <MenuItem onAction={onOpenInvite} icon={<UserPlusIcon className="h-4 w-4" />}>
          Invite People
        </MenuItem>
      </ContextMenu>
    </>
  );
}
