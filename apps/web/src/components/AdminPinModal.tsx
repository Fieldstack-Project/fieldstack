import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button, Input, Modal } from "@fieldstack/controls";

// 개발 mock PIN — 실제 구현 시 API 검증으로 교체
const MOCK_ADMIN_PIN = "1234";
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 300; // 5분

interface AdminPinModalProps {
  onVerified: () => void;
  onClose: () => void;
}

export function AdminPinModal({ onVerified, onClose }: AdminPinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 잠금 카운트다운
  useEffect(() => {
    if (lockedUntil === null) return;
    const tick = () => {
      const left = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (left <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setError("");
        setRemaining(0);
        inputRef.current?.focus();
      } else {
        setRemaining(left);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  // 모달 열릴 때 포커스
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isLocked = lockedUntil !== null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isLocked || pin.length < 4) return;

    if (pin === MOCK_ADMIN_PIN) {
      onVerified();
      return;
    }

    const next = attempts + 1;
    setAttempts(next);
    setPin("");

    if (next >= MAX_ATTEMPTS) {
      const until = Date.now() + LOCKOUT_SECONDS * 1000;
      setLockedUntil(until);
      setError(`PIN ${MAX_ATTEMPTS}회 오류 — 5분간 잠금`);
    } else {
      setError(`PIN이 올바르지 않습니다. (${next}/${MAX_ATTEMPTS})`);
      inputRef.current?.focus();
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="관리자 인증"
      size="sm"
      footer={
        <>
          <Button type="button" onClick={onClose}>취소</Button>
          <Button variant="primary" type="submit" form="pin-form" disabled={pin.length < 4 || isLocked}>
            확인
          </Button>
        </>
      }
    >
      <div className="pin-modal-header">
        <span className="pin-modal-icon" aria-hidden="true">🔐</span>
        <p className="pin-modal-desc">관리자 PIN을 입력하세요. 인증은 30분간 유효합니다.</p>
      </div>

      <form id="pin-form" onSubmit={handleSubmit} noValidate>
        <Input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="••••"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ""));
            if (!isLocked) setError("");
          }}
          disabled={isLocked}
          autoComplete="off"
          aria-label="관리자 PIN"
          error={error ? (isLocked ? `${error} — ${remaining}초 후 재시도 가능` : error) : undefined}
        />
      </form>

      <p className="pin-modal-hint">개발 mock PIN: 1234</p>
    </Modal>
  );
}
