import React from 'react';
function Progress({ value, max = 100, variant = 'primary', className = '' }) {
  const getBarClass = () => {
    switch (variant) {
      case 'success':
        return 'bg-[var(--color-success)]';
      case 'destructive':
      case 'danger':
        return 'bg-[var(--color-danger)]';
      case 'primary':
      default:
        return 'bg-[var(--color-primary)]';
    }
  };
  return (
    <div
      className={`group cursor-pointer w-full rounded-full overflow-visible bg-gray-200 ${className}`}
    >
      <div
        className={`${getBarClass()} transition-transform duration-200 ease-in-out transform origin-bottom group-hover:scale-y-110`}
        style={{ width: `${(value / max) * 100}%`, height: '100%' }}
      />
    </div>
  );
}

export { Progress };
export default Progress;
