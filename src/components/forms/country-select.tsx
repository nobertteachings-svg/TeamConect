"use client";

import { ALL_COUNTRY_OPTIONS } from "@/lib/countries-full";

type Props = {
  value: string;
  onChange: (code: string) => void;
  placeholder: string;
  className?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
};

export function CountrySelect({
  value,
  onChange,
  placeholder,
  className = "tc-select",
  id,
  required,
  disabled,
}: Props) {
  return (
    <select
      id={id}
      required={required}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="">{placeholder}</option>
      {ALL_COUNTRY_OPTIONS.map(({ code, label }) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  );
}
