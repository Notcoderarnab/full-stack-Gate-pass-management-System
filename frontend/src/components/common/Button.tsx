import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 dark:bg-blue-500 dark:hover:bg-blue-600',
  outline:
    'border border-gray-200 hover:border-blue-600 hover:text-blue-600 text-gray-700 bg-transparent dark:border-slate-600 dark:text-slate-300 dark:hover:border-blue-400 dark:hover:text-blue-400',
  ghost:
    'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800',
  danger:
    'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-sm px-4 py-2 rounded-xl',
  md: 'text-sm px-5 py-2.5 rounded-xl',
  lg: 'text-base px-7 py-3.5 rounded-2xl',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-semibold
        transition-all duration-200 cursor-pointer select-none
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
