import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Common country codes with flags (sorted by frequency of use in Netherlands)
const countryCodes = [
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+32", country: "Belgium", flag: "🇧🇪" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+1", country: "US/Canada", flag: "🇺🇸" },
  { code: "+48", country: "Poland", flag: "🇵🇱" },
  { code: "+90", country: "Turkey", flag: "🇹🇷" },
  { code: "+212", country: "Morocco", flag: "🇲🇦" },
  { code: "+597", country: "Suriname", flag: "🇸🇷" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
  { code: "+40", country: "Romania", flag: "🇷🇴" },
  { code: "+359", country: "Bulgaria", flag: "🇧🇬" },
  { code: "+93", country: "Afghanistan", flag: "🇦🇫" },
  { code: "+355", country: "Albania", flag: "🇦🇱" },
  { code: "+213", country: "Algeria", flag: "🇩🇿" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+374", country: "Armenia", flag: "🇦🇲" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+43", country: "Austria", flag: "🇦🇹" },
  { code: "+994", country: "Azerbaijan", flag: "🇦🇿" },
  { code: "+973", country: "Bahrain", flag: "🇧🇭" },
  { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
  { code: "+375", country: "Belarus", flag: "🇧🇾" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+45", country: "Denmark", flag: "🇩🇰" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+372", country: "Estonia", flag: "🇪🇪" },
  { code: "+251", country: "Ethiopia", flag: "🇪🇹" },
  { code: "+358", country: "Finland", flag: "🇫🇮" },
  { code: "+995", country: "Georgia", flag: "🇬🇪" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+30", country: "Greece", flag: "🇬🇷" },
  { code: "+36", country: "Hungary", flag: "🇭🇺" },
  { code: "+354", country: "Iceland", flag: "🇮🇸" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" },
  { code: "+98", country: "Iran", flag: "🇮🇷" },
  { code: "+964", country: "Iraq", flag: "🇮🇶" },
  { code: "+353", country: "Ireland", flag: "🇮🇪" },
  { code: "+972", country: "Israel", flag: "🇮🇱" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+962", country: "Jordan", flag: "🇯🇴" },
  { code: "+7", country: "Kazakhstan/Russia", flag: "🇰🇿" },
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+965", country: "Kuwait", flag: "🇰🇼" },
  { code: "+371", country: "Latvia", flag: "🇱🇻" },
  { code: "+961", country: "Lebanon", flag: "🇱🇧" },
  { code: "+370", country: "Lithuania", flag: "🇱🇹" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+977", country: "Nepal", flag: "🇳🇵" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+92", country: "Pakistan", flag: "🇵🇰" },
  { code: "+63", country: "Philippines", flag: "🇵🇭" },
  { code: "+974", country: "Qatar", flag: "🇶🇦" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+380", country: "Ukraine", flag: "🇺🇦" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳" }
];

interface EnhancedPhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}

export function EnhancedPhoneInput({ value = "", onChange, onBlur, placeholder = "Phone number" }: EnhancedPhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  
  // Parse current value to get country code and number
  const sortedCountryCodes = countryCodes.sort((a, b) => b.code.length - a.code.length);
  const currentCountryCode = sortedCountryCodes.find(cc => value.startsWith(cc.code))?.code || "+31";
  const phoneNumber = value.replace(currentCountryCode, "").trim();
  
  const selectedCountry = countryCodes.find(cc => cc.code === currentCountryCode);

  const filteredCountryCodes = countryCodes.filter(country =>
    country.country.toLowerCase().includes(search.toLowerCase()) ||
    country.code.includes(search)
  );

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleCountrySelect = (countryCode: string) => {
    const newValue = `${countryCode} ${phoneNumber}`.trim();
    onChange(newValue);
    setSearch("");
    setOpen(false);
  };

  const handleNumberChange = (newNumber: string) => {
    // Remove any non-numeric characters except spaces and dashes for input
    const cleanedNumber = newNumber.replace(/[^\d\s-]/g, '');
    const rawNumber = cleanedNumber.replace(/\D/g, ''); // Only digits for storage
    const newValue = `${currentCountryCode} ${rawNumber}`.trim();
    onChange(newValue);
  };

  // Format phone number for display
  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  };

  return (
    <div className="flex">
      <div className="relative" ref={dropdownRef}>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[140px] justify-between rounded-r-none border-r-0 font-normal"
          onClick={() => setOpen(!open)}
        >
          <span className="flex items-center gap-1">
            {selectedCountry?.flag} {currentCountryCode}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
        
        {open && (
          <div 
            className="absolute z-[9999] w-[300px] mt-1 bg-white border border-gray-200 rounded-md shadow-lg"
            style={{ zIndex: 9999 }}
          >
            {/* Search Input */}
            <div className="flex items-center border-b px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                ref={searchRef}
                className="border-0 p-0 h-6 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            {/* Results List */}
            <div 
              className="max-h-[300px] overflow-y-auto py-1"
              style={{ 
                overflowY: 'auto',
                scrollBehavior: 'smooth'
              }}
            >
              {filteredCountryCodes.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">
                  No country found.
                </div>
              ) : (
                filteredCountryCodes.map((country) => (
                  <button
                    key={country.code}
                    className="w-full flex items-center px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer text-left font-normal"
                    onClick={() => handleCountrySelect(country.code)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentCountryCode === country.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex items-center gap-2">
                      {country.flag} {country.code} {country.country}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      <Input
        value={formatPhoneNumber(phoneNumber)}
        onChange={(e) => handleNumberChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="rounded-l-none"
        type="tel"
      />
    </div>
  );
}