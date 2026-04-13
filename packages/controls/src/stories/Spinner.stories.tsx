import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from '../components/Spinner.js';

const meta: Meta<typeof Spinner> = {
  title: 'Controls/Spinner',
  component: Spinner,
};
export default meta;

type Story = StoryObj<typeof Spinner>;

export const Inline: Story = { args: { label: '로딩 중...', inline: true } };
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <Spinner size="sm" inline />
      <Spinner size="md" inline />
      <Spinner size="lg" inline />
    </div>
  ),
};
