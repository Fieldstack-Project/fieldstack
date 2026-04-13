import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../components/Input.js';

const meta: Meta<typeof Input> = {
  title: 'Controls/Input',
  component: Input,
  args: { placeholder: '입력하세요' },
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {};
export const WithError: Story = { args: { error: '필수 입력 항목입니다.', defaultValue: '' } };
export const WithHelpText: Story = { args: { helpText: '영문·숫자 포함 8자 이상' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: '비활성화' } };
export const Password: Story = { args: { type: 'password', placeholder: '비밀번호' } };
