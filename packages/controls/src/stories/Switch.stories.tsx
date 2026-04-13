import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from '../components/Switch.js';

const meta: Meta = { title: 'Controls/Switch' };
export default meta;

export const Default: StoryObj = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return <Switch checked={checked} onChange={setChecked} label="알림 활성화" />;
  },
};

export const On: StoryObj = {
  render: () => <Switch checked={true} onChange={() => {}} label="활성화됨" />,
};

export const Disabled: StoryObj = {
  render: () => <Switch checked={false} onChange={() => {}} label="비활성화" disabled />,
};
