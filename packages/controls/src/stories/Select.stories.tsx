import type { Meta, StoryObj } from '@storybook/react';
import { Select } from '../components/Select.js';

const options = [
  { label: '옵션 A', value: 'a' },
  { label: '옵션 B', value: 'b' },
  { label: '옵션 C (비활성)', value: 'c', disabled: true },
];

const meta: Meta<typeof Select> = {
  title: 'Controls/Select',
  component: Select,
  args: { options },
};
export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = { args: { placeholder: '선택하세요' } };
export const WithError: Story = { args: { placeholder: '선택하세요', error: '항목을 선택해주세요.' } };
export const Disabled: Story = { args: { disabled: true, placeholder: '비활성화' } };
