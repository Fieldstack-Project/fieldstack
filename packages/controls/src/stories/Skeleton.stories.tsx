import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from '../components/Skeleton.js';

const meta: Meta = { title: 'Controls/Skeleton', parameters: { layout: 'padded' } };
export default meta;

export const Text: StoryObj = { render: () => <Skeleton variant="text" lines={3} /> };
export const Circular: StoryObj = { render: () => <Skeleton variant="circular" width={48} height={48} /> };
export const Rect: StoryObj = { render: () => <Skeleton variant="rect" width={320} height={120} /> };
export const Card: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Skeleton variant="circular" width={40} height={40} />
      <div style={{ flex: 1 }}>
        <Skeleton variant="text" lines={2} />
      </div>
    </div>
  ),
};
