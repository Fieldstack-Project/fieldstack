export interface ProgressProps {
  value: number;
  size?: 'sm' | 'md';
  label?: string;
  className?: string;
}

export interface StepProgressProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function Progress({ value, size = 'md', label, className = '' }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className={`fs-progress ${size === 'sm' ? 'fs-progress-sm' : ''} ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="fs-progress-bar" style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function StepProgress({ steps, currentStep, className = '' }: StepProgressProps) {
  return (
    <div className={`fs-steps ${className}`} aria-label={`${currentStep + 1}/${steps.length} 단계`}>
      {steps.map((step, i) => {
        const isDone = i < currentStep;
        const isActive = i === currentStep;
        const stepClass = isDone
          ? 'fs-step fs-step-done'
          : isActive
          ? 'fs-step fs-step-active'
          : 'fs-step';

        return (
          <div key={step} className={stepClass}>
            <div
              className="fs-step-dot"
              aria-label={`${step} ${isDone ? '(완료)' : isActive ? '(현재)' : ''}`}
            >
              {isDone ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && <div className="fs-step-line" aria-hidden="true" />}
          </div>
        );
      })}
    </div>
  );
}
