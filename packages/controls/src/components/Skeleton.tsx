export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rect';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  className = '',
}: SkeletonProps) {
  const style = {
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  if (variant === 'text') {
    return (
      <>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`fs-skeleton fs-skeleton-text ${className}`}
            style={{
              ...style,
              width: i === lines - 1 && lines > 1 ? '70%' : style.width,
            }}
            aria-hidden="true"
          />
        ))}
      </>
    );
  }

  const variantClass =
    variant === 'circular' ? 'fs-skeleton-circle' : 'fs-skeleton-rect';

  return (
    <div
      className={`fs-skeleton ${variantClass} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}
