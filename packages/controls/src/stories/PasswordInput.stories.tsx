import type { Meta, StoryObj } from '@storybook/react';
import { PasswordInput } from '../components/PasswordInput.js';

const meta: Meta<typeof PasswordInput> = {
  title: 'Controls/PasswordInput',
  component: PasswordInput,
  args: { placeholder: '비밀번호 입력' },
};
export default meta;

type Story = StoryObj<typeof PasswordInput>;

export const Default: Story = {};
export const Weak: Story = { args: { defaultValue: 'abc' } };
export const Fair: Story = { args: { defaultValue: 'abcd1234' } };
export const Strong: Story = { args: { defaultValue: 'Abcd1234!' } };
export const WithError: Story = { args: { error: '비밀번호가 일치하지 않습니다.' } };
