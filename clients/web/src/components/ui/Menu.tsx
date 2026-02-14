import { type ReactNode } from 'react';
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuTrigger,
  Popover,
  SubmenuTrigger as AriaSubmenuTrigger,
  Section,
  Header,
  Separator as AriaSeparator,
  type MenuItemProps as AriaMenuItemProps,
  type Selection,
  type PopoverProps,
  type Key,
} from 'react-aria-components';
import { type VariantProps } from 'tailwind-variants';
import { ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import { menuStyles } from './menu-styles';

type MenuVariants = VariantProps<typeof menuStyles>;

interface MenuProps {
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'start' | 'end';
  placement?: 'bottom' | 'top';
}

// Map our simplified placement API to valid React Aria Placement values
const placementMap: Record<string, PopoverProps['placement']> = {
  'bottom-start': 'bottom start',
  'bottom-end': 'bottom end',
  'top-start': 'top start',
  'top-end': 'top end',
};

export function Menu({
  trigger,
  children,
  open,
  onOpenChange,
  align = 'end',
  placement = 'bottom',
}: MenuProps) {
  const styles = menuStyles();

  const popoverPlacement = placementMap[`${placement}-${align}`];

  return (
    <MenuTrigger isOpen={open} onOpenChange={onOpenChange}>
      {trigger}
      <Popover placement={popoverPlacement} className={styles.popover()}>
        <AriaMenu className={styles.menu()}>{children}</AriaMenu>
      </Popover>
    </MenuTrigger>
  );
}

interface MenuItemProps extends Omit<AriaMenuItemProps, 'className'>, MenuVariants {
  icon?: ReactNode;
  children: ReactNode;
}

export function MenuItem({ children, variant, icon, ...props }: MenuItemProps) {
  const styles = menuStyles({ variant });

  return (
    <AriaMenuItem className={styles.item()} {...props}>
      {icon}
      {children}
    </AriaMenuItem>
  );
}

interface SubmenuTriggerProps extends MenuVariants {
  icon?: ReactNode;
  label: ReactNode;
  children: ReactNode;
}

export function SubmenuTrigger({ label, children, variant, icon }: SubmenuTriggerProps) {
  const styles = menuStyles({ variant });

  return (
    <AriaSubmenuTrigger>
      <AriaMenuItem className={styles.item()}>
        {icon}
        <span className="flex-1">{label}</span>
        <ChevronRightIcon className="h-4 w-4" />
      </AriaMenuItem>
      <Popover offset={-2} crossOffset={-4} className={styles.popover()}>
        <AriaMenu className={styles.menu()}>{children}</AriaMenu>
      </Popover>
    </AriaSubmenuTrigger>
  );
}

interface MenuSectionProps {
  children: ReactNode;
}

export function MenuSection({ children }: MenuSectionProps) {
  const styles = menuStyles();

  return <Section className={styles.section()}>{children}</Section>;
}

interface MenuHeaderProps {
  children: ReactNode;
}

export function MenuHeader({ children }: MenuHeaderProps) {
  const styles = menuStyles();

  return <Header className={styles.header()}>{children}</Header>;
}

export function MenuSeparator() {
  const styles = menuStyles();

  return <AriaSeparator className={styles.separator()} />;
}

interface SelectMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  selectedKey: Key;
  onSelectionChange: (key: Key) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'start' | 'end';
  placement?: 'bottom' | 'top';
}

export function SelectMenu({
  trigger,
  children,
  selectedKey,
  onSelectionChange,
  open,
  onOpenChange,
  align = 'end',
  placement = 'bottom',
}: SelectMenuProps) {
  const styles = menuStyles();
  const popoverPlacement = placementMap[`${placement}-${align}`];

  const handleSelectionChange = (keys: Selection) => {
    const selected = [...keys][0];
    if (selected !== undefined) {
      onSelectionChange(selected);
    }
  };

  return (
    <MenuTrigger isOpen={open} onOpenChange={onOpenChange}>
      {trigger}
      <Popover placement={popoverPlacement} className={styles.popover()}>
        <AriaMenu
          className={styles.menu()}
          selectionMode="single"
          selectedKeys={[selectedKey]}
          onSelectionChange={handleSelectionChange}
        >
          {children}
        </AriaMenu>
      </Popover>
    </MenuTrigger>
  );
}

interface SelectMenuItemProps extends Omit<AriaMenuItemProps, 'className'>, MenuVariants {
  icon?: ReactNode;
  children: ReactNode;
}

export function SelectMenuItem({ children, variant, icon, ...props }: SelectMenuItemProps) {
  const styles = menuStyles({ variant });

  return (
    <AriaMenuItem className={styles.item()} {...props}>
      {({ isSelected }) => (
        <>
          {icon}
          <span className="flex-1">{children}</span>
          {isSelected && <CheckIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
        </>
      )}
    </AriaMenuItem>
  );
}

export { MenuTrigger };
