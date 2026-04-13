import type { Meta, StoryObj } from '@storybook/react';
import { Progress, StepProgress } from '../components/Progress.js';

const meta: Meta = { title: 'Controls/Progress', parameters: { layout: 'padded' } };
export default meta;

export const Linear25: StoryObj = { render: () => <Progress value={25} label="업로드 중..." /> };
export const Linear75: StoryObj = { render: () => <Progress value={75} /> };
export const Steps: StoryObj = {
  render: () => (
    <StepProgress
      steps={[
        { id: '1', label: '기본 정보', status: 'done' },
        { id: '2', label: '계정 설정', status: 'active' },
        { id: '3', label: '완료', status: 'pending' },
      ]}
    />
  ),
};
