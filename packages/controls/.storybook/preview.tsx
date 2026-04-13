import type { Preview, Decorator } from '@storybook/react';
import '../src/styles/controls.css';

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string) ?? 'light';
  document.documentElement.setAttribute('data-theme', theme);
  return <Story />;
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
  parameters: {
    layout: 'centered',
    backgrounds: { disable: true },
  },
};

export default preview;
