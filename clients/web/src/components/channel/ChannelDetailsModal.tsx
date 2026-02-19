import { useState, useEffect } from 'react';
import {
  Modal,
  Avatar,
  Button,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Spinner,
  RadioGroup,
  Radio,
} from '../ui';
import { useChannelMembers, useAddChannelMember, useUpdateChannel } from '../../hooks/useChannels';
import { useWorkspaceMembers } from '../../hooks/useWorkspaces';
import { cn } from '../../lib/utils';
import type {
  ChannelMember,
  WorkspaceMemberWithUser,
  ChannelWithMembership,
} from '@enzyme/api-client';
import { ApiError } from '@enzyme/api-client';

const validChannelName = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type TabId = 'about' | 'members' | 'add';

interface ChannelDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  workspaceId: string;
  canAddMembers: boolean;
  canEditChannel: boolean;
  channel: ChannelWithMembership;
  defaultTab?: TabId;
}

export function ChannelDetailsModal({
  isOpen,
  onClose,
  channelId,
  workspaceId,
  canAddMembers,
  canEditChannel,
  channel,
  defaultTab = 'about',
}: ChannelDetailsModalProps) {
  const { data: membersData, isLoading: membersLoading } = useChannelMembers(channelId);
  const { data: workspaceMembersData, isLoading: workspaceMembersLoading } =
    useWorkspaceMembers(workspaceId);
  const addMember = useAddChannelMember(channelId);
  const updateChannel = useUpdateChannel(workspaceId, channelId);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description || '');
  const [type, setType] = useState<'public' | 'private'>(
    channel.type === 'private' ? 'private' : 'public',
  );
  const [selectedTab, setSelectedTab] = useState<TabId>(defaultTab);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Reset state when modal opens or channel changes
  useEffect(() => {
    if (isOpen) {
      setName(channel.name);
      setDescription(channel.description || '');
      setType(channel.type === 'private' ? 'private' : 'public');
      setSelectedTab(defaultTab);
      setSaveError(null);
    }
  }, [isOpen, channel.name, channel.description, channel.type, defaultTab]);

  const members = membersData?.members || [];
  const workspaceMembers = workspaceMembersData?.members || [];

  // Filter workspace members to only show those not already in the channel
  const channelMemberIds = new Set(members.map((m) => m.user_id));
  const nonMembers = workspaceMembers.filter((m) => !channelMemberIds.has(m.user_id));

  const handleAddMember = async (userId: string) => {
    setAddingUserId(userId);
    try {
      await addMember.mutateAsync({ userId });
    } finally {
      setAddingUserId(null);
    }
  };

  const isNameValid = name.trim() === '' || validChannelName.test(name.trim());

  const hasNameChanged = name !== channel.name;
  const hasDescriptionChanged = description !== (channel.description || '');
  const hasTypeChanged = type !== channel.type;
  const hasChanges = hasNameChanged || hasDescriptionChanged || hasTypeChanged;

  const handleSave = async () => {
    setSaveError(null);
    const input: Record<string, string | undefined> = {};
    if (hasNameChanged) input.name = name;
    if (hasDescriptionChanged) input.description = description;
    if (hasTypeChanged) input.type = type;
    try {
      await updateChannel.mutateAsync(input as Parameters<typeof updateChannel.mutateAsync>[0]);
      onClose();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Failed to update channel');
    }
  };

  const getRoleBadge = (role?: string) => {
    if (!role || role === 'poster') return null;
    return (
      <span
        className={cn(
          'rounded px-1.5 py-0.5 text-xs',
          role === 'admin'
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
        )}
      >
        {role}
      </span>
    );
  };

  const isDMChannel = channel.type === 'dm' || channel.type === 'group_dm';
  const showVisibilityToggle = canEditChannel && !channel.is_default && !isDMChannel;

  const canSave = hasChanges && isNameValid && name.trim() !== '' && !updateChannel.isPending;

  const renderAboutTab = () => (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave) handleSave();
      }}
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Channel name
        </label>
        {canEditChannel ? (
          <>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                setSaveError(null);
              }}
              className="focus:ring-primary-500 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
            {name.trim() !== '' && !isNameValid && (
              <p className="mt-1 text-xs text-red-500">
                Must contain only lowercase letters, numbers, and dashes
              </p>
            )}
          </>
        ) : (
          <p className="text-gray-900 dark:text-white">{channel.name}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        {canEditChannel ? (
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setSaveError(null);
            }}
            placeholder="Add a description for this channel..."
            className="focus:ring-primary-500 w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            rows={3}
          />
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            {channel.description || 'No description set'}
          </p>
        )}
      </div>
      {showVisibilityToggle && (
        <RadioGroup
          label="Visibility"
          value={type}
          onChange={(value) => {
            setType(value as 'public' | 'private');
            setSaveError(null);
          }}
        >
          <Radio value="public">Public</Radio>
          <Radio value="private">Private</Radio>
        </RadioGroup>
      )}
      {canEditChannel && (
        <div className="flex items-center justify-end gap-3">
          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
          <Button
            size="sm"
            onPress={handleSave}
            isLoading={updateChannel.isPending}
            isDisabled={!canSave}
          >
            Save
          </Button>
        </div>
      )}
    </form>
  );

  const renderMemberList = (membersList: ChannelMember[]) => (
    <div className="max-h-64 space-y-1 overflow-y-auto">
      {membersList.map((member) => (
        <div
          key={member.user_id}
          className="flex items-center gap-3 rounded px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        >
          <Avatar
            src={member.avatar_url}
            name={member.display_name}
            id={member.user_id}
            size="sm"
          />
          <span className="flex-1 text-gray-900 dark:text-white">{member.display_name}</span>
          {getRoleBadge(member.channel_role)}
        </div>
      ))}
      {membersList.length === 0 && (
        <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          No members found
        </p>
      )}
    </div>
  );

  const renderAddMemberList = (membersList: WorkspaceMemberWithUser[]) => (
    <div className="max-h-64 space-y-1 overflow-y-auto">
      {membersList.map((member) => {
        const displayName = member.display_name_override || member.display_name;
        const isAdding = addingUserId === member.user_id;

        return (
          <div
            key={member.user_id}
            className="flex items-center gap-3 rounded px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <Avatar src={member.avatar_url} name={displayName} id={member.user_id} size="sm" />
            <span className="flex-1 text-gray-900 dark:text-white">{displayName}</span>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => handleAddMember(member.user_id)}
              isLoading={isAdding}
              isDisabled={addMember.isPending}
            >
              Add
            </Button>
          </div>
        );
      })}
      {membersList.length === 0 && (
        <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          All workspace members are already in this channel
        </p>
      )}
    </div>
  );

  const isGroupDM = channel.type === 'group_dm';
  const isLoading = membersLoading || (canAddMembers && workspaceMembersLoading);

  // For group DMs, default to members tab since there's no about tab
  const effectiveTab = isGroupDM && selectedTab === 'about' ? 'members' : selectedTab;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isGroupDM ? 'Conversation Details' : 'Channel Details'}
      size="md"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <Tabs selectedKey={effectiveTab} onSelectionChange={(key) => setSelectedTab(key as TabId)}>
          <TabList>
            {!isGroupDM && <Tab id="about">About</Tab>}
            <Tab id="members">Members ({members.length})</Tab>
            {canAddMembers && <Tab id="add">Add Members</Tab>}
          </TabList>
          {!isGroupDM && (
            <TabPanel id="about" className="pt-4">
              {renderAboutTab()}
            </TabPanel>
          )}
          <TabPanel id="members" className="pt-4">
            {renderMemberList(members)}
          </TabPanel>
          {canAddMembers && (
            <TabPanel id="add" className="pt-4">
              {renderAddMemberList(nonMembers)}
            </TabPanel>
          )}
        </Tabs>
      )}
    </Modal>
  );
}
