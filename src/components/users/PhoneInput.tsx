
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const COUNTRY_CODES = [
  { code: "+31", country: "NL", name: "Netherlands" },
  { code: "+32", country: "BE", name: "Belgium" },
  { code: "+49", country: "DE", name: "Germany" },
  { code: "+33", country: "FR", name: "France" },
  { code: "+44", country: "GB", name: "United Kingdom" },
  { code: "+1", country: "US", name: "United States" },
];

export function PhoneInput({ value, onChange, placeholder = "Phone number" }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState("+31");
  
  // Extract country code and number from existing value
  const getCountryAndNumber = (phoneValue: string) => {
    const country = COUNTRY_CODES.find(c => phoneValue.startsWith(c.code));
    if (country) {
      return {
        countryCode: country.code,
        number: phoneValue.substring(country.code.length).trim()
      };
    }
    return { countryCode: "+31", number: phoneValue };
  };

  const { countryCode, number } = getCountryAndNumber(value);

  const handleCountryChange = (newCountryCode: string) => {
    setSelectedCountry(newCountryCode);
    onChange(`${newCountryCode} ${number}`);
  };

  const handleNumberChange = (newNumber: string) => {
    onChange(`${selectedCountry} ${newNumber}`);
  };

  return (
    <div className="flex space-x-2">
      <Select value={countryCode} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_CODES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={number}
        onChange={(e) => handleNumberChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1"
      />
    </div>
  );
}
