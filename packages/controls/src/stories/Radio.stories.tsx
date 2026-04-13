import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RadioGroup } from '../components/Radio.js';

const meta: Meta = { title: 'Controls/Radio' };
export default meta;

export const Default: StoryObj = {
  render: () => {
    const [value, setValue] = useState('a');
    return (
      <RadioGroup
        name="demo"
        value={value}
        onChange={setValue}
        options={[
          { label: '옵션 A', value: 'a' },
          { label: '옵션 B', value: 'b' },
          { label: '옵션 C (비활성)', value: 'c', disabled: true },
        ]}
      />
    );
  },
};
