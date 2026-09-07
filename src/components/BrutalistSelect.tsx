import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface BrutalistSelectOption {
  value: string;
  label: string;
  icon?: React.ElementType;
  flag?: string;
}

export interface BrutalistSelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: BrutalistSelectOption[];
  name?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  icon?: React.ElementType;
  placeholder?: string;
}

export function BrutalistSelect({
  value: controlledValue,
  defaultValue,
  onChange,
  options,
  name,
  disabled = false,
  className = "",
  buttonClassName = "",
  icon: Icon,
  placeholder = "Select Option",
}: BrutalistSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [internalValue, setInternalValue] = useState(defaultValue || options[0]?.value || "");
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = (val: string) => {
    if (!isControlled) setInternalValue(val);
    if (onChange) onChange(val);
  };

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {name && <input type="hidden" name={name} value={value} />}
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-3 h-10 px-3 border-2 border-brand-blue bg-brand-white text-brand-blue font-mono text-xs font-black uppercase transition-all shadow-[3px_3px_0px_#113669] w-full ${
          disabled
            ? "bg-brand-grey/50 border-brand-grey text-brand-blue/50 shadow-none cursor-not-allowed"
            : "cursor-pointer hover:bg-brand-grey/20 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {Icon && <Icon className="w-4 h-4 text-brand-orange shrink-0" />}
          {selectedOption?.flag && <span className="text-sm shrink-0">{selectedOption.flag}</span>}
          {selectedOption?.icon && <selectedOption.icon className="w-4 h-4 shrink-0" />}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 min-w-full w-max max-w-[calc(100vw-32px)] border-2 border-brand-blue bg-brand-white shadow-[4px_4px_0px_#113669] z-50 animate-in slide-in-from-top-2 duration-150">
          <ul className="py-1 max-h-60 overflow-y-auto relative">
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => {
                      handleChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`flex items-center gap-2 w-full text-left px-4 py-2 font-mono text-xs font-black uppercase transition-colors hover:bg-brand-grey/30 text-brand-blue ${
                      isSelected ? "bg-brand-blue/5" : ""
                    }`}
                  >
                    {option.flag && <span className="text-sm shrink-0">{option.flag}</span>}
                    {option.icon && <option.icon className="w-4 h-4 shrink-0" />}
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
