import type { Meta, StoryObj } from '@storybook/react';
import { Progress, StepProgress } from '../components/Progress.js';

const meta: Meta = { title: 'Controls/Progress', parameters: { layout: 'padded' } };
export default meta;

export const Linear25: StoryObj = { render: () => <Progress value={25} label="업로드 중..." /> };
export const Linear75: StoryObj = { render: () => <Progress value={75} /> };
export const Steps: StoryObj = {
  render: () => (
    <StepProgress
      steps={['기본 정보', '계정 설정', '완료']}
      currentStep={1}
    />
  ),
};
