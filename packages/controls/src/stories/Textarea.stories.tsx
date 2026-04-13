import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from '../components/Textarea.js';

const meta: Meta<typeof Textarea> = {
  title: 'Controls/Textarea',
  component: Textarea,
  args: { placeholder: '내용을 입력하세요' },
};
export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};
export const WithError: Story = { args: { error: '내용을 입력해주세요.', defaultValue: '' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: '비활성화된 텍스트' } };
