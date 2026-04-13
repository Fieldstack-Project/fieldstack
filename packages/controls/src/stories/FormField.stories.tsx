import type { Meta, StoryObj } from '@storybook/react';
import { FormField } from '../components/FormField.js';
import { Input } from '../components/Input.js';

const meta: Meta = { title: 'Controls/FormField' };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <FormField label="이메일" htmlFor="email">
      <Input id="email" type="email" placeholder="name@example.com" />
    </FormField>
  ),
};

export const Required: StoryObj = {
  render: () => (
    <FormField label="이름" htmlFor="name" required>
      <Input id="name" placeholder="홍길동" />
    </FormField>
  ),
};

export const WithError: StoryObj = {
  render: () => (
    <FormField label="이메일" htmlFor="email-err" required error="올바른 이메일 형식이 아닙니다.">
      <Input id="email-err" type="email" defaultValue="invalid" />
    </FormField>
  ),
};

export const WithHelpText: StoryObj = {
  render: () => (
    <FormField label="비밀번호" htmlFor="pw" helpText="영문·숫자·특수문자 포함 8자 이상">
      <Input id="pw" type="password" placeholder="비밀번호 입력" />
    </FormField>
  ),
};
