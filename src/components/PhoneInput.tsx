"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { BrutalistSelect } from "./BrutalistSelect";

const dialCodes = [
  { name: "None / Username", code: "", flag: "🌐" },
  { name: "Egypt", code: "+20", flag: "🇪🇬" },
  { name: "Saudi Arabia", code: "+966", flag: "🇸🇦" },
  { name: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
  { name: "Kuwait", code: "+965", flag: "🇰🇼" },
  { name: "Qatar", code: "+974", flag: "🇶🇦" },
  { name: "Bahrain", code: "+973", flag: "🇧🇭" },
  { name: "Oman", code: "+968", flag: "🇴🇲" },
  { name: "Jordan", code: "+962", flag: "🇯🇴" },
  { name: "United States", code: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { name: "Germany", code: "+49", flag: "🇩🇪" },
  { name: "France", code: "+33", flag: "🇫🇷" },
  { name: "Spain", code: "+34", flag: "🇪🇸" },
  { name: "Italy", code: "+39", flag: "🇮🇹" },
  { name: "Turkey", code: "+90", flag: "🇹🇷" },
  { name: "India", code: "+91", flag: "🇮🇳" },
  { name: "Australia", code: "+61", flag: "🇦🇺" },
  { name: "Brazil", code: "+55", flag: "🇧🇷" },
  { name: "South Africa", code: "+27", flag: "🇿🇦" },
];

export default function PhoneInput({ name, defaultValue = "", disabled = false, placeholder = "", isRtl = false }: any) {
  const [dialCode, setDialCode] = useState("");
  const [number, setNumber] = useState("");

  useEffect(() => {
    if (defaultValue) {
      const sortedCodes = [...dialCodes].filter(d => d.code).sort((a, b) => b.code.length - a.code.length);
      const match = sortedCodes.find(d => defaultValue.startsWith(d.code));
      if (match) {
        setDialCode(match.code);
        setNumber(defaultValue.slice(match.code.length));
      } else {
        setDialCode("");
        setNumber(defaultValue);
      }
    } else {
      setDialCode("");
      setNumber("");
    }
  }, [defaultValue]);

  return (
    <div className="flex relative">
      <div className="relative shrink-0 flex w-fit">
        <BrutalistSelect
          disabled={disabled}
          value={dialCode}
          onChange={setDialCode}
          options={dialCodes.map(d => ({ label: d.code, value: d.code, flag: d.flag }))}
          className="h-10"
          buttonClassName={`${isRtl ? "border-l-0" : "border-r-0 shadow-[2px_3px_0px_#113669]"} !shadow-none z-10`}
        />
      </div>
      <input
        type="text"
        disabled={disabled}
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        placeholder={placeholder}
        className={`h-10 w-full px-3 bg-brand-bg/25 border-2 border-brand-blue text-brand-blue focus:outline-none focus:bg-brand-grey/25 transition-all text-xs font-semibold ${
          disabled ? "cursor-not-allowed bg-brand-grey/25 border-dashed border-brand-blue/40 text-brand-blue/40" : ""
        }`}
      />
      <input type="hidden" name={name} value={`${dialCode}${number}`} />
    </div>
  );
}
