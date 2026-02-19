import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '../../test-utils';
import { Tabs, TabList, Tab, TabPanel } from './Tabs';

describe('Tabs', () => {
  it('renders tabs with tab list and panels', () => {
    render(
      <Tabs>
        <TabList>
          <Tab id="tab1">Tab 1</Tab>
          <Tab id="tab2">Tab 2</Tab>
        </TabList>
        <TabPanel id="tab1">Content 1</TabPanel>
        <TabPanel id="tab2">Content 2</TabPanel>
      </Tabs>,
    );

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();
  });

  it('shows first tab panel by default', () => {
    render(
      <Tabs>
        <TabList>
          <Tab id="tab1">Tab 1</Tab>
          <Tab id="tab2">Tab 2</Tab>
        </TabList>
        <TabPanel id="tab1">Content 1</TabPanel>
        <TabPanel id="tab2">Content 2</TabPanel>
      </Tabs>,
    );

    expect(screen.getByRole('tabpanel')).toHaveTextContent('Content 1');
  });

  it('switches tab panel when tab is clicked', async () => {
    const user = userEvent.setup();

    render(
      <Tabs>
        <TabList>
          <Tab id="tab1">Tab 1</Tab>
          <Tab id="tab2">Tab 2</Tab>
        </TabList>
        <TabPanel id="tab1">Content 1</TabPanel>
        <TabPanel id="tab2">Content 2</TabPanel>
      </Tabs>,
    );

    await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

    expect(screen.getByRole('tabpanel')).toHaveTextContent('Content 2');
  });

  it('supports controlled selectedKey', () => {
    render(
      <Tabs selectedKey="tab2">
        <TabList>
          <Tab id="tab1">Tab 1</Tab>
          <Tab id="tab2">Tab 2</Tab>
        </TabList>
        <TabPanel id="tab1">Content 1</TabPanel>
        <TabPanel id="tab2">Content 2</TabPanel>
      </Tabs>,
    );

    expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Content 2');
  });

  it('supports keyboard navigation with arrow keys', async () => {
    const user = userEvent.setup();

    render(
      <Tabs>
        <TabList>
          <Tab id="tab1">Tab 1</Tab>
          <Tab id="tab2">Tab 2</Tab>
          <Tab id="tab3">Tab 3</Tab>
        </TabList>
        <TabPanel id="tab1">Content 1</TabPanel>
        <TabPanel id="tab2">Content 2</TabPanel>
        <TabPanel id="tab3">Content 3</TabPanel>
      </Tabs>,
    );

    // Focus first tab
    await user.click(screen.getByRole('tab', { name: 'Tab 1' }));

    // Navigate with arrow key
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveFocus();
  });

  it('applies custom className to Tabs', () => {
    const { container } = render(
      <Tabs className="custom-tabs">
        <TabList>
          <Tab id="tab1">Tab 1</Tab>
        </TabList>
        <TabPanel id="tab1">Content</TabPanel>
      </Tabs>,
    );

    expect(container.querySelector('.custom-tabs')).toBeInTheDocument();
  });

  it('applies custom className to TabList', () => {
    render(
      <Tabs>
        <TabList className="custom-list">
          <Tab id="tab1">Tab 1</Tab>
        </TabList>
        <TabPanel id="tab1">Content</TabPanel>
      </Tabs>,
    );

    expect(screen.getByRole('tablist')).toHaveClass('custom-list');
  });

  it('marks selected tab with aria-selected', () => {
    render(
      <Tabs>
        <TabList>
          <Tab id="tab1">Tab 1</Tab>
          <Tab id="tab2">Tab 2</Tab>
        </TabList>
        <TabPanel id="tab1">Content 1</TabPanel>
        <TabPanel id="tab2">Content 2</TabPanel>
      </Tabs>,
    );

    expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('aria-selected', 'false');
  });

  it('disables tab when isDisabled is true', () => {
    render(
      <Tabs>
        <TabList>
          <Tab id="tab1">Tab 1</Tab>
          <Tab id="tab2" isDisabled>
            Tab 2
          </Tab>
        </TabList>
        <TabPanel id="tab1">Content 1</TabPanel>
        <TabPanel id="tab2">Content 2</TabPanel>
      </Tabs>,
    );

    expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('aria-disabled', 'true');
  });
});
