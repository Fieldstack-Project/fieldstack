import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox, CheckboxGroup } from '../components/Checkbox.js';

const meta: Meta = { title: 'Controls/Checkbox' };
export default meta;

export const Single: StoryObj = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return <Checkbox checked={checked} onChange={setChecked} label="동의합니다" />;
  },
};

export const Indeterminate: StoryObj = {
  render: () => <Checkbox checked={false} indeterminate onChange={() => {}} label="일부 선택됨" />,
};

export const Group: StoryObj = {
  render: () => {
    const [values, setValues] = useState<string[]>(['a']);
    return (
      <CheckboxGroup
        values={values}
        onChange={setValues}
        options={[
          { label: '항목 A', value: 'a' },
          { label: '항목 B', value: 'b' },
          { label: '항목 C (비활성)', value: 'c', disabled: true },
        ]}
      />
    );
  },
};
