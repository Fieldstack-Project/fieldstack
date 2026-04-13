import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SearchInput } from '../components/SearchInput.js';

const meta: Meta = { title: 'Controls/SearchInput' };
export default meta;

export const Default: StoryObj = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <SearchInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onClear={() => setValue('')}
        onSearch={(v) => console.log('search:', v)}
        placeholder="검색어 입력..."
        debounceMs={300}
      />
    );
  },
};
