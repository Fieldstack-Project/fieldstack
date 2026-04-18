import { useEffect, useState, type FormEvent } from "react";

import { Button, Modal, PinInput } from "@fieldstack/controls";

import { apiFetch } from "../lib/apiFetch";

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
  const [isVerifying, setIsVerifying] = useState(false);

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
      } else {
        setRemaining(left);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const isLocked = lockedUntil !== null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLocked || pin.length < 4 || isVerifying) return;

    setIsVerifying(true);
    try {
      const res = await apiFetch("/admin/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
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
      }
    } catch {
      setError("서버 연결 오류. 다시 시도해주세요.");
      setPin("");
    } finally {
      setIsVerifying(false);
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
          <Button type="button" onClick={onClose} disabled={isVerifying}>취소</Button>
          <Button
            variant="primary"
            type="submit"
            form="pin-form"
            disabled={pin.length < 4 || isLocked || isVerifying}
            loading={isVerifying}
          >
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
        <PinInput
          length={4}
          value={pin}
          onChange={(val: string) => {
            setPin(val);
            if (!isLocked) setError("");
          }}
          disabled={isLocked || isVerifying}
          error={error ? (isLocked ? `${error} — ${remaining}초 후 재시도 가능` : error) : undefined}
        />
      </form>
    </Modal>
  );
}
