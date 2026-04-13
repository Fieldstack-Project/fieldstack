import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox, CheckboxGroup } from '../components/Checkbox.js';

const meta: Meta = { title: 'Controls/Checkbox' };
export default meta;

export const Single: StoryObj = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <Checkbox
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        label="동의합니다"
      />
    );
  },
};

export const Indeterminate: StoryObj = {
  render: () => <Checkbox checked={false} indeterminate onChange={() => {}} label="일부 선택됨" />,
};

export const Group: StoryObj = {
  render: () => {
    const [checkedA, setCheckedA] = useState(true);
    const [checkedB, setCheckedB] = useState(false);
    return (
      <CheckboxGroup label="항목 선택">
        <Checkbox checked={checkedA} onChange={(e) => setCheckedA(e.target.checked)} label="항목 A" />
        <Checkbox checked={checkedB} onChange={(e) => setCheckedB(e.target.checked)} label="항목 B" />
        <Checkbox checked={false} onChange={() => {}} label="항목 C (비활성)" disabled />
      </CheckboxGroup>
    );
  },
};
