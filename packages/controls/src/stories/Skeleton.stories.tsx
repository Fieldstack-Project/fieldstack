import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from '../components/Skeleton.js';

const meta: Meta = { title: 'Controls/Skeleton', parameters: { layout: 'padded' } };
export default meta;

export const Text: StoryObj = { render: () => <Skeleton type="text" lines={3} /> };
export const Circular: StoryObj = { render: () => <Skeleton type="circular" width={48} height={48} /> };
export const Rect: StoryObj = { render: () => <Skeleton type="rect" width={320} height={120} /> };
export const Card: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Skeleton type="circular" width={40} height={40} />
      <div style={{ flex: 1 }}>
        <Skeleton type="text" lines={2} />
      </div>
    </div>
  ),
};
