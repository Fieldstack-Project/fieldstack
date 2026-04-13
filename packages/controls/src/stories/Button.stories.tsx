import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../components/Button.js';

const meta: Meta<typeof Button> = {
  title: 'Controls/Button',
  component: Button,
  args: { children: 'Button' },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { variant: 'primary', children: 'Primary' } };
export const Secondary: Story = { args: { variant: 'secondary', children: 'Secondary' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Danger' } };
export const Ghost: Story = { args: { variant: 'ghost', children: 'Ghost' } };
export const Loading: Story = { args: { variant: 'primary', loading: true, children: 'Loading' } };
export const Disabled: Story = { args: { variant: 'primary', disabled: true, children: 'Disabled' } };
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <Button size="sm" variant="primary">Small</Button>
      <Button size="md" variant="primary">Medium</Button>
      <Button size="lg" variant="primary">Large</Button>
    </div>
  ),
};
