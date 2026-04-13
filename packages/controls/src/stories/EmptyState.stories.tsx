import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from '../components/EmptyState.js';

const meta: Meta<typeof EmptyState> = {
  title: 'Controls/EmptyState',
  component: EmptyState,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: { icon: '📭', title: '데이터가 없습니다', description: '항목을 추가하면 여기에 표시됩니다.' },
};

export const WithAction: Story = {
  args: {
    icon: '📦',
    title: '모듈이 없습니다',
    description: '마켓플레이스에서 모듈을 설치해보세요.',
    action: { label: '마켓플레이스 보기', onClick: () => alert('navigate') },
  },
};
