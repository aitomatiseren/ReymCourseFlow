import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Common nationalities sorted by frequency/usage
const nationalities = [
  "Dutch", "German", "Belgian", "French", "British", "American", "Polish", "Turkish", 
  "Moroccan", "Surinamese", "Spanish", "Italian", "Portuguese", "Romanian", "Bulgarian",
  "Afghan", "Albanian", "Algerian", "Andorran", "Angolan", "Argentine", "Armenian", 
  "Australian", "Austrian", "Azerbaijani", "Bahraini", "Bangladeshi", "Barbadian",
  "Belarusian", "Belizean", "Beninese", "Bhutanese", "Bolivian", "Bosnian", "Botswanan",
  "Brazilian", "Bruneian", "Burkinabe", "Burmese", "Burundian", "Cambodian", "Cameroonian",
  "Canadian", "Cape Verdean", "Central African", "Chadian", "Chilean", "Chinese", "Colombian",
  "Comoran", "Congolese", "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech", "Danish",
  "Djiboutian", "Dominican", "East Timorese", "Ecuadorean", "Egyptian", "Emirian", "Equatorial Guinean",
  "Eritrean", "Estonian", "Ethiopian", "Fijian", "Filipino", "Finnish", "Gabonese", "Gambian",
  "Georgian", "Ghanaian", "Greek", "Grenadian", "Guatemalan", "Guinea-Bissauan", "Guinean",
  "Guyanese", "Haitian", "Honduran", "Hungarian", "Icelandic", "Indian", "Indonesian", "Iranian",
  "Iraqi", "Irish", "Israeli", "Ivorian", "Jamaican", "Japanese", "Jordanian", "Kazakhstani",
  "Kenyan", "Kiribati", "Kuwaiti", "Kyrgyz", "Laotian", "Latvian", "Lebanese", "Liberian",
  "Libyan", "Liechtensteiner", "Lithuanian", "Luxembourgish", "Macedonian", "Malagasy", "Malawian",
  "Malaysian", "Maldivan", "Malian", "Maltese", "Marshallese", "Mauritanian", "Mauritian",
  "Mexican", "Micronesian", "Moldovan", "Monacan", "Mongolian", "Montenegrin", "Mozambican",
  "Namibian", "Nauruan", "Nepalese", "New Zealander", "Nicaraguan", "Nigerian", "Nigerien",
  "North Korean", "Norwegian", "Omani", "Pakistani", "Palauan", "Palestinian", "Panamanian",
  "Papua New Guinean", "Paraguayan", "Peruvian", "Qatari", "Russian", "Rwandan", "Saint Lucian",
  "Salvadoran", "Samoan", "San Marinese", "Sao Tomean", "Saudi", "Senegalese", "Serbian",
  "Seychellois", "Sierra Leonean", "Singaporean", "Slovak", "Slovenian", "Solomon Islander",
  "Somali", "South African", "South Korean", "South Sudanese", "Sri Lankan", "Sudanese",
  "Swazi", "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese",
  "Tongan", "Trinidadian", "Tunisian", "Turkmen", "Tuvaluan", "Ugandan", "Ukrainian", "Uruguayan",
  "Uzbek", "Vanuatuan", "Venezuelan", "Vietnamese", "Yemeni", "Zambian", "Zimbabwean"
];

interface NationalitySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function NationalitySelect({ value, onValueChange, placeholder = "Select nationality..." }: NationalitySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredNationalities = nationalities.filter(nationality =>
    nationality.toLowerCase().includes(search.toLowerCase())
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

  const handleSelect = (nationality: string) => {
    onValueChange(nationality);
    setSearch("");
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between font-normal"
        onClick={() => setOpen(!open)}
      >
        {value || placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      {open && (
        <div 
          className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg"
          style={{ zIndex: 9999 }}
        >
          {/* Search Input */}
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={searchRef}
              className="border-0 p-0 h-6 focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Search nationality..."
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
            {filteredNationalities.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">
                No nationality found.
              </div>
            ) : (
              filteredNationalities.map((nationality) => (
                <button
                  key={nationality}
                  className="w-full flex items-center px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer text-left font-normal"
                  onClick={() => handleSelect(nationality)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === nationality ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {nationality}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}