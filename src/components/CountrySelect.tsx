"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Globe, Search, Check, ChevronDown } from "lucide-react";

export interface Country {
  name: string;
  code: string;
  flag: string;
}

export const countries: Country[] = [
  { name: "Egypt", code: "EG", flag: "🇪🇬" },
  { name: "Poland", code: "PL", flag: "🇵🇱" },
  { name: "Saudi Arabia", code: "SA", flag: "🇸🇦" },
  { name: "United Arab Emirates", code: "AE", flag: "🇦🇪" },
  { name: "United States", code: "US", flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧" },
  { name: "Canada", code: "CA", flag: "🇨🇦" },
  { name: "Germany", code: "DE", flag: "🇩🇪" },
  { name: "France", code: "FR", flag: "🇫🇷" },
  { name: "Italy", code: "IT", flag: "🇮🇹" },
  { name: "Spain", code: "ES", flag: "🇪🇸" },
  { name: "Jordan", code: "JO", flag: "🇯🇴" },
  { name: "Kuwait", code: "KW", flag: "🇰🇼" },
  { name: "Qatar", code: "QA", flag: "🇶🇦" },
  { name: "Oman", code: "OM", flag: "🇴🇲" },
  { name: "Bahrain", code: "BH", flag: "🇧🇭" },
  { name: "Turkey", code: "TR", flag: "🇹🇷" },
  { name: "Australia", code: "AU", flag: "🇦🇺" },
  { name: "India", code: "IN", flag: "🇮🇳" },
  { name: "Brazil", code: "BR", flag: "🇧🇷" },
  { name: "South Africa", code: "ZA", flag: "🇿🇦" },
  { name: "Japan", code: "JP", flag: "🇯🇵" },
  { name: "South Korea", code: "KR", flag: "🇰🇷" },
  { name: "Singapore", code: "SG", flag: "🇸🇬" },
  { name: "Netherlands", code: "NL", flag: "🇳🇱" },
  { name: "Sweden", code: "SE", flag: "🇸🇪" },
  { name: "Switzerland", code: "CH", flag: "🇨🇭" },
];

interface CountrySelectProps {
  value: string; // Country name
  onChange: (countryName: string) => void;
  lang?: string;
  isRtl?: boolean;
}

export default function CountrySelect({ value, onChange, lang = "English", isRtl = false }: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountry = useMemo(() => {
    return countries.find((c) => c.name.toLowerCase() === value.toLowerCase()) || countries[0];
  }, [value]);

  const filteredCountries = useMemo(() => {
    return countries.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchPlaceholder = isRtl ? "ابحث عن الدولة..." : "ENTER COUNTRY TO SEARCH HERE";

  return (
    <div className="relative text-left w-full font-sans" ref={dropdownRef}>
      {/* Hidden input for form submission */}
      <input type="hidden" name="country" value={selectedCountry.name} />

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-brand-bg/25 border-2 border-brand-blue rounded-none px-4 py-3.5 text-sm text-brand-blue focus:outline-none focus:border-brand-orange focus:bg-brand-white transition-all font-semibold cursor-pointer`}
      >
        <span className="flex items-center gap-2.5">
          <span className="text-lg">{selectedCountry.flag}</span>
          <span>{selectedCountry.name}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-brand-blue/50 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-brand-white border-2 border-brand-blue rounded-none shadow-[4px_4px_0px_#113669] z-50 overflow-hidden flex flex-col">
          {/* Search Box */}
          <div className="relative border-b-2 border-brand-blue p-2 bg-brand-bg/5 flex items-center">
            <span className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-4" : "left-4"} text-brand-blue/40`}>
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className={`w-full bg-brand-white border border-brand-blue/20 rounded-none ${isRtl ? "pr-10 pl-3" : "pl-10 pr-3"} py-2 text-xs text-brand-blue focus:outline-none focus:border-brand-orange font-semibold`}
            />
          </div>

          {/* List of Countries */}
          <div className="max-h-56 overflow-y-auto divide-y divide-brand-blue/10">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => {
                const isSelected = c.name.toLowerCase() === selectedCountry.name.toLowerCase();
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onChange(c.name);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-brand-blue hover:bg-brand-orange/15 transition-all text-start cursor-pointer ${
                      isSelected ? "bg-brand-blue/5 font-bold" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-lg">{c.flag}</span>
                      <span>{c.name}</span>
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-brand-orange shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-xs text-brand-blue/50 font-mono uppercase tracking-wider text-center">
                {isRtl ? "لا توجد نتائج" : "No results found"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
