import { useState, useRef, useEffect } from 'react';
import { PhotoIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  useWorkspace,
  useWorkspaceMembers,
  useUpdateMemberRole,
  useRemoveMember,
  useUploadWorkspaceIcon,
  useDeleteWorkspaceIcon,
  useCreateInvite,
} from '../../hooks/useWorkspaces';
import { useAuth } from '../../hooks';
import { Modal, Avatar, Button, Spinner, Tabs, TabList, Tab, TabPanel, toast } from '../ui';
import { CustomEmojiManager } from './CustomEmojiManager';
import { cn, getAvatarColor } from '../../lib/utils';
import type { WorkspaceRole } from '@feather/api-client';

export type WorkspaceSettingsTab = 'general' | 'members' | 'emoji' | 'invite';

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  defaultTab?: WorkspaceSettingsTab;
}

export function WorkspaceSettingsModal({
  isOpen,
  onClose,
  workspaceId,
  defaultTab = 'general',
}: WorkspaceSettingsModalProps) {
  const { user } = useAuth();
  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(workspaceId);
  const { data: membersData, isLoading: membersLoading } = useWorkspaceMembers(workspaceId);
  const updateRole = useUpdateMemberRole(workspaceId);
  const removeMember = useRemoveMember(workspaceId);
  const uploadIcon = useUploadWorkspaceIcon(workspaceId);
  const deleteIcon = useDeleteWorkspaceIcon(workspaceId);
  const createInvite = useCreateInvite(workspaceId);

  const [selectedTab, setSelectedTab] = useState<WorkspaceSettingsTab>(defaultTab);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState('7');
  const [maxUses, setMaxUses] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const members = membersData?.members ?? [];
  const isLoading = workspaceLoading || membersLoading;

  // Reset state when modal opens (React-recommended "adjust state during render" pattern)
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevDefaultTab, setPrevDefaultTab] = useState(defaultTab);
  if ((isOpen && !prevOpen) || (isOpen && defaultTab !== prevDefaultTab)) {
    setPrevOpen(isOpen);
    setPrevDefaultTab(defaultTab);
    setSelectedTab(defaultTab);
    setSelectedFile(null);
    setPreviewUrl(null);
    setInviteLink(null);
    setExpiresIn('7');
    setMaxUses('');
  }
  if (!isOpen && prevOpen) {
    setPrevOpen(false);
  }

  // Revoke object URL on change or unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Clear file input after file state is reset (needs DOM access, so must be in effect)
  useEffect(() => {
    if (!selectedFile && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedFile]);

  const handleRoleChange = async (userId: string, role: WorkspaceRole) => {
    try {
      await updateRole.mutateAsync({ userId, role });
      toast('Role updated', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update role', 'error');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await removeMember.mutateAsync(userId);
      toast('Member removed', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to remove member', 'error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast('Invalid file type. Please use JPEG, PNG, GIF, or WebP.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast('File too large. Maximum size is 5MB.', 'error');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadIcon = async () => {
    if (!selectedFile) return;
    try {
      await uploadIcon.mutateAsync(selectedFile);
      toast('Workspace icon updated', 'success');
      handleClearSelection();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to upload icon', 'error');
    }
  };

  const handleRemoveIcon = async () => {
    try {
      await deleteIcon.mutateAsync();
      toast('Workspace icon removed', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to remove icon', 'error');
    }
  };

  const handleCreateInvite = async () => {
    try {
      const days = parseInt(expiresIn);
      const result = await createInvite.mutateAsync({
        role: 'member',
        expires_in_hours: days ? days * 24 : undefined,
        max_uses: maxUses ? parseInt(maxUses) : undefined,
      });
      const link = `${window.location.origin}/invites/${result.invite.code}`;
      setInviteLink(link);
      toast('Invite link created!', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create invite', 'error');
    }
  };

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast('Link copied to clipboard', 'success');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Workspace Settings" size="xl">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(key as WorkspaceSettingsTab)}
        >
          <TabList>
            <Tab id="general">General</Tab>
            <Tab id="members">Members ({members.length})</Tab>
            <Tab id="emoji">Emoji</Tab>
            <Tab id="invite">Invite</Tab>
          </TabList>

          <TabPanel id="general" className="max-h-[60vh] overflow-y-auto pt-4">
            <div className="space-y-6">
              {/* Workspace Icon */}
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Workspace Icon
                </label>
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl',
                      !previewUrl && !workspace?.workspace.icon_url && getAvatarColor(workspaceId),
                    )}
                  >
                    {previewUrl || workspace?.workspace.icon_url ? (
                      <img
                        src={previewUrl || workspace?.workspace.icon_url}
                        alt={workspace?.workspace.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {workspace?.workspace.name?.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {selectedFile ? (
                      <>
                        <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                          Selected: {selectedFile.name}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onPress={handleUploadIcon}
                            isLoading={uploadIcon.isPending}
                          >
                            <PhotoIcon className="mr-1 h-4 w-4" />
                            Save Icon
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onPress={handleClearSelection}
                            isDisabled={uploadIcon.isPending}
                          >
                            <XMarkIcon className="mr-1 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onPress={() => fileInputRef.current?.click()}
                        >
                          <PhotoIcon className="mr-1 h-4 w-4" />
                          Upload Icon
                        </Button>
                        {workspace?.workspace.icon_url && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onPress={handleRemoveIcon}
                            isLoading={deleteIcon.isPending}
                          >
                            <TrashIcon className="mr-1 h-4 w-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      JPEG, PNG, GIF, or WebP. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Workspace Name
                </label>
                <p className="text-gray-900 dark:text-white">{workspace?.workspace.name}</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Workspace ID
                </label>
                <p className="text-gray-900 dark:text-white">{workspace?.workspace.id}</p>
              </div>
            </div>
          </TabPanel>

          <TabPanel id="members" className="max-h-[60vh] overflow-y-auto pt-4">
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={member.avatar_url}
                      name={member.display_name || 'User'}
                      id={member.user_id}
                      size="md"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.display_name}
                        {member.user_id === user?.id && (
                          <span className="ml-2 text-xs text-gray-500">(you)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(member.user_id, e.target.value as WorkspaceRole)
                      }
                      disabled={member.user_id === user?.id}
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>

                    {member.user_id !== user?.id && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onPress={() => handleRemoveMember(member.user_id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabPanel>

          <TabPanel id="emoji" className="max-h-[60vh] overflow-y-auto pt-4">
            <CustomEmojiManager workspaceId={workspaceId} />
          </TabPanel>

          <TabPanel id="invite" className="max-h-[60vh] overflow-y-auto pt-4">
            <div className="space-y-6 rounded-lg bg-gray-50 p-6 dark:bg-gray-800">
              <p className="text-gray-600 dark:text-gray-300">
                Create an invite link to share with people you want to join this workspace.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Expires in (days)
                  </label>
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="1">1 day</option>
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="">Never</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Max uses
                  </label>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="Unlimited"
                    min="1"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <Button onPress={handleCreateInvite} isLoading={createInvite.isPending}>
                Generate Invite Link
              </Button>

              {inviteLink && (
                <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-700">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your invite link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-900 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
                    />
                    <Button onPress={handleCopyLink} variant="secondary">
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabPanel>
        </Tabs>
      )}
    </Modal>
  );
}
