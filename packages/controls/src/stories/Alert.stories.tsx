import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from '../components/Alert.js';

const meta: Meta<typeof Alert> = {
  title: 'Controls/Alert',
  component: Alert,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof Alert>;

export const Success: Story = { args: { variant: 'success', children: '저장되었습니다.' } };
export const Warning: Story = { args: { variant: 'warning', children: '변경사항이 저장되지 않을 수 있습니다.' } };
export const Error: Story = { args: { variant: 'error', children: '오류가 발생했습니다. 다시 시도해주세요.' } };
export const Info: Story = { args: { variant: 'info', children: '시스템 점검이 예정되어 있습니다.' } };
export const WithTitle: Story = {
  args: { variant: 'error', title: '인증 실패', children: '이메일 또는 비밀번호를 확인해주세요.' },
};
export const WithClose: Story = {
  args: { variant: 'info', children: '닫기 버튼이 있는 알림입니다.', onClose: () => {} },
};
