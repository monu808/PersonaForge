import React from 'react';
import { ChevronDown } from 'lucide-react';

// Basic placeholder for Shadcn UI Select component
// In a real scenario, you would install and use the actual library
// npm install @radix-ui/react-select @radix-ui/react-slot class-variance-authority clsx lucide-react tailwind-merge

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType>({
  isOpen: false,
  setIsOpen: () => {},
});

export const Select = ({ 
  children, 
  value, 
  onValueChange 
}: { 
  children: React.ReactNode; 
  value?: string; 
  onValueChange?: (value: string) => void;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement, 
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, className, ...props }, ref) => {
  const { isOpen, setIsOpen } = React.useContext(SelectContext);
  
  const baseStyle = "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
  
  return (
    <button 
      ref={ref} 
      className={`${baseStyle} ${className}`} 
      onClick={() => setIsOpen(!isOpen)}
      type="button"
      {...props}
    >
      {children}
      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

export const SelectValue = ({ 
  placeholder, 
  children 
}: { 
  placeholder?: string;
  children?: React.ReactNode;
}) => {
  const { value } = React.useContext(SelectContext);
  
  if (children) {
    return <span>{children}</span>;
  }
  
  return <span>{value || placeholder}</span>;
};

export const SelectContent = ({ 
  children, 
  className, 
  ...props 
}: { 
  children: React.ReactNode; 
  className?: string;
}) => {
  const { isOpen, setIsOpen } = React.useContext(SelectContext);
  
  const baseStyle = "absolute z-50 min-w-full mt-1 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md";
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop to close dropdown when clicking outside */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={() => setIsOpen(false)}
      />
      <div className={`${baseStyle} ${className}`} {...props}>
        <div className="max-h-60 overflow-y-auto p-1">
          {children}
        </div>
      </div>
    </>
  );
};

export const SelectItem = ({ 
  children, 
  value, 
  className, 
  ...props 
}: { 
  children: React.ReactNode; 
  value: string; 
  className?: string;
}) => {
  const { onValueChange, setIsOpen, value: selectedValue } = React.useContext(SelectContext);
  
  const baseStyle = "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";
  const isSelected = selectedValue === value;
  
  return (
    <div
      className={`${baseStyle} ${isSelected ? 'bg-accent text-accent-foreground' : ''} ${className}`}
      onClick={() => {
        onValueChange?.(value);
        setIsOpen(false);
      }}
      {...props}
    >
      {children}
    </div>
  );
};

