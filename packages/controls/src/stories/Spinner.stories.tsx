import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from '../components/Spinner.js';

const meta: Meta<typeof Spinner> = {
  title: 'Controls/Spinner',
  component: Spinner,
};
export default meta;

type Story = StoryObj<typeof Spinner>;

export const Default: Story = { args: { label: '로딩 중...' } };
export const Blocking: Story = { args: { blocking: true, label: '처리 중...' } };
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
};
