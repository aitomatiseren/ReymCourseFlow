import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";

interface CityCountryResult {
  city: string;
  country: string;
  region?: string;
}

interface CityCountryLookupProps {
  onSelect: (result: CityCountryResult) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  value?: string;
}

export function CityCountryLookup({ onSelect, onValueChange, placeholder = "Enter city name...", value = "" }: CityCountryLookupProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<CityCountryResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync internal query state with external value prop
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const searchCities = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Using OpenCage API key from environment variables
      const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY;
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(searchQuery)}&key=${apiKey}&limit=10&no_annotations=1`
      );

      if (response.ok) {
        const data = await response.json();
        const citySuggestions: CityCountryResult[] = data.results?.slice(0, 8).map((result: any) => {
          const components = result.components;
          return {
            city: components.city || components.town || components.village || components.municipality || components.county || searchQuery,
            country: components.country || 'Unknown',
            region: components.state || components.region || components.province
          };
        }).filter((result: CityCountryResult) => result.city && result.country !== 'Unknown') || [];

        if (citySuggestions.length > 0) {
          setSuggestions(citySuggestions);
          return;
        }
      }

      // REST Countries API (free, no key needed)
      const countryResponse = await fetch(
        `https://restcountries.com/v3.1/name/${encodeURIComponent(searchQuery)}?fields=name,capital`
      );

      if (countryResponse.ok) {
        const countryData = await countryResponse.json();
        const countrySuggestions: CityCountryResult[] = countryData.slice(0, 5).map((country: any) => ({
          city: country.capital?.[0] || searchQuery,
          country: country.name.common
        }));
        
        if (countrySuggestions.length > 0) {
          setSuggestions(countrySuggestions);
          return;
        }
      }

      // Fallback to local database
      await searchWithCommonCities(searchQuery);
    } catch (error) {
      console.error('City lookup error:', error);
      await searchWithCommonCities(searchQuery);
    } finally {
      setIsLoading(false);
    }
  };

  const searchWithCommonCities = async (searchQuery: string) => {
    // Common cities database for fallback
    const commonCities = [
      { city: "Amsterdam", country: "Netherlands" },
      { city: "Rotterdam", country: "Netherlands" },
      { city: "The Hague", country: "Netherlands" },
      { city: "Utrecht", country: "Netherlands" },
      { city: "Eindhoven", country: "Netherlands" },
      { city: "Brussels", country: "Belgium" },
      { city: "Antwerp", country: "Belgium" },
      { city: "Berlin", country: "Germany" },
      { city: "Munich", country: "Germany" },
      { city: "Hamburg", country: "Germany" },
      { city: "London", country: "United Kingdom" },
      { city: "Paris", country: "France" },
      { city: "Madrid", country: "Spain" },
      { city: "Rome", country: "Italy" },
      { city: "Warsaw", country: "Poland" },
      { city: "Istanbul", country: "Turkey" },
      { city: "Casablanca", country: "Morocco" },
      { city: "Paramaribo", country: "Suriname" },
      { city: "New York", country: "United States" },
      { city: "Toronto", country: "Canada" },
      { city: "Sydney", country: "Australia" },
      { city: "Tokyo", country: "Japan" },
      { city: "Beijing", country: "China" },
      { city: "Mumbai", country: "India" },
      { city: "São Paulo", country: "Brazil" },
      { city: "Cairo", country: "Egypt" },
      { city: "Lagos", country: "Nigeria" },
      { city: "Nairobi", country: "Kenya" },
      { city: "Dubai", country: "United Arab Emirates" },
      { city: "Singapore", country: "Singapore" },
      { city: "Bangkok", country: "Thailand" },
      { city: "Manila", country: "Philippines" },
      { city: "Jakarta", country: "Indonesia" },
      { city: "Kuala Lumpur", country: "Malaysia" },
      { city: "Ho Chi Minh City", country: "Vietnam" },
      { city: "Seoul", country: "South Korea" },
      { city: "Almaty", country: "Kazakhstan" },
      { city: "Tashkent", country: "Uzbekistan" },
      { city: "Baku", country: "Azerbaijan" },
      { city: "Tbilisi", country: "Georgia" },
      { city: "Yerevan", country: "Armenia" },
      { city: "Kabul", country: "Afghanistan" },
      { city: "Dhaka", country: "Bangladesh" },
      { city: "Islamabad", country: "Pakistan" },
      { city: "Kathmandu", country: "Nepal" },
      { city: "Colombo", country: "Sri Lanka" },
      { city: "Rangoon", country: "Myanmar" },
      { city: "Phnom Penh", country: "Cambodia" },
      { city: "Vientiane", country: "Laos" },
      { city: "Hanoi", country: "Vietnam" },
      { city: "Ulaanbaatar", country: "Mongolia" },
      { city: "Bishkek", country: "Kyrgyzstan" },
      { city: "Dushanbe", country: "Tajikistan" },
      { city: "Ashgabat", country: "Turkmenistan" }
    ];

    const filtered = commonCities.filter(item => 
      item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.country.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10);

    setSuggestions(filtered);
  };

  const debouncedSearch = useCallback((value: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      if (value.length > 2) {
        searchCities(value);
      } else {
        setSuggestions([]);
      }
    }, 300);
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    debouncedSearch(value);
    if (onValueChange) {
      onValueChange(value);
    }
  };

  const handleSelect = (result: CityCountryResult) => {
    setQuery(result.city);
    setSuggestions([]);
    onSelect(result);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {suggestions.length > 0 && (
        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((result, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start p-3 text-left hover:bg-gray-50"
              onClick={() => handleSelect(result)}
            >
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                <div>
                  <div className="font-medium">{result.city}</div>
                  <div className="text-sm text-gray-500">
                    {result.country}{result.region && `, ${result.region}`}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3">
          <div className="text-sm text-gray-500">Searching cities...</div>
        </div>
      )}
    </div>
  );
}