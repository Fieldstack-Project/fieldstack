import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { OtpInput } from '../components/OtpInput.js';

const meta: Meta = { title: 'Controls/OtpInput' };
export default meta;

export const FourDigit: StoryObj = {
  render: () => {
    const [value, setValue] = useState('');
    const handleChange = (v: string) => {
      setValue(v);
      if (v.length === 4) alert(`완료: ${v}`);
    };
    return <OtpInput length={4} value={value} onChange={handleChange} />;
  },
};

export const SixDigit: StoryObj = {
  render: () => {
    const [value, setValue] = useState('');
    const handleChange = (v: string) => {
      setValue(v);
      if (v.length === 6) alert(`완료: ${v}`);
    };
    return <OtpInput length={6} value={value} onChange={handleChange} />;
  },
};

export const WithError: StoryObj = {
  render: () => {
    const [value, setValue] = useState('');
    return <OtpInput length={6} value={value} onChange={setValue} error="인증 코드가 올바르지 않습니다." />;
  },
};
