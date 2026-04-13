import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from '../components/Modal.js';
import { Button } from '../components/Button.js';

const meta: Meta = { title: 'Controls/Modal', parameters: { layout: 'fullscreen' } };
export default meta;

function ModalDemo({ size }: { size?: 'sm' | 'md' | 'lg' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        {size?.toUpperCase() ?? 'MD'} 모달 열기
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="모달 제목"
        size={size}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>취소</Button>
            <Button variant="primary" onClick={() => setOpen(false)}>확인</Button>
          </>
        }
      >
        <p>모달 본문 내용입니다. ESC 키 또는 배경 클릭으로 닫을 수 있습니다.</p>
      </Modal>
    </>
  );
}

export const Small: StoryObj = { render: () => <ModalDemo size="sm" /> };
export const Medium: StoryObj = { render: () => <ModalDemo size="md" /> };
export const Large: StoryObj = { render: () => <ModalDemo size="lg" /> };
