import type { Meta, StoryObj } from '@storybook/react';
import { ToastProvider, useToast } from '../components/Toast.js';
import { Button } from '../components/Button.js';

const meta: Meta = { title: 'Controls/Toast' };
export default meta;

function ToastDemo() {
  const { toast } = useToast();
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Button variant="primary" onClick={() => toast({ variant: 'success', message: '저장되었습니다.' })}>
        Success
      </Button>
      <Button onClick={() => toast({ variant: 'warning', message: '주의가 필요합니다.' })}>
        Warning
      </Button>
      <Button variant="danger" onClick={() => toast({ variant: 'error', message: '오류가 발생했습니다.' })}>
        Error
      </Button>
      <Button variant="ghost" onClick={() => toast({ variant: 'info', message: '정보 메시지입니다.' })}>
        Info
      </Button>
    </div>
  );
}

export const Default: StoryObj = {
  render: () => (
    <ToastProvider>
      <ToastDemo />
    </ToastProvider>
  ),
};
