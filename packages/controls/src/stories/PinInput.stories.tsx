import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PinInput } from '../components/PinInput.js';

const meta: Meta = { title: 'Controls/PinInput' };
export default meta;

export const FourDigit: StoryObj = {
  render: () => {
    const [value, setValue] = useState('');
    const handleChange = (v: string) => {
      setValue(v);
      if (v.length === 4) alert(`PIN 입력 완료: ${v}`);
    };
    return <PinInput length={4} value={value} onChange={handleChange} />;
  },
};

export const SixDigit: StoryObj = {
  render: () => {
    const [value, setValue] = useState('');
    const handleChange = (v: string) => {
      setValue(v);
      if (v.length === 6) alert(`PIN 입력 완료: ${v}`);
    };
    return <PinInput length={6} value={value} onChange={handleChange} />;
  },
};

export const WithError: StoryObj = {
  render: () => {
    const [value, setValue] = useState('');
    return <PinInput length={4} value={value} onChange={setValue} error="PIN이 올바르지 않습니다. (1/5)" />;
  },
};

export const Disabled: StoryObj = {
  render: () => {
    return <PinInput length={4} value="12" onChange={() => undefined} disabled />;
  },
};
