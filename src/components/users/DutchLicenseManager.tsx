
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DUTCH_LICENSE_TYPES = [
  { code: 'AM', description: 'Bromfiets (max. 45 km/h)' },
  { code: 'A1', description: 'Lichte motorfiets (max. 125cc)' },
  { code: 'A2', description: 'Middelzware motorfiets (max. 35kW)' },
  { code: 'A', description: 'Zware motorfiets' },
  { code: 'B', description: 'Personenauto' },
  { code: 'BE', description: 'Personenauto met aanhanger' },
  { code: 'C1', description: 'Lichte vrachtwagen (3,5-7,5 ton)' },
  { code: 'C1E', description: 'Lichte vrachtwagen met aanhanger' },
  { code: 'C', description: 'Vrachtwagen' },
  { code: 'CE', description: 'Vrachtwagen met aanhanger' },
  { code: 'D1', description: 'Kleine bus (max. 16 personen)' },
  { code: 'D1E', description: 'Kleine bus met aanhanger' },
  { code: 'D', description: 'Bus' },
  { code: 'DE', description: 'Bus met aanhanger' },
  { code: 'T', description: 'Trekker/landbouwvoertuig' }
];

interface License {
  code: string;
  startDate: string;
  expiryDate: string;
}

interface DutchLicenseManagerProps {
  licenses: License[];
  onChange: (licenses: License[]) => void;
}

export function DutchLicenseManager({ licenses, onChange }: DutchLicenseManagerProps) {
  const [licenseData, setLicenseData] = useState<Record<string, License>>({});

  useEffect(() => {
    const licenseMap: Record<string, License> = {};
    licenses.forEach(license => {
      licenseMap[license.code] = license;
    });
    setLicenseData(licenseMap);
  }, [licenses]);

  const handleLicenseToggle = (code: string, checked: boolean) => {
    const newLicenseData = { ...licenseData };
    
    if (checked) {
      newLicenseData[code] = {
        code,
        startDate: '',
        expiryDate: ''
      };
    } else {
      delete newLicenseData[code];
    }
    
    setLicenseData(newLicenseData);
    onChange(Object.values(newLicenseData));
  };

  const handleDateChange = (code: string, field: 'startDate' | 'expiryDate', value: string) => {
    const newLicenseData = { ...licenseData };
    if (newLicenseData[code]) {
      newLicenseData[code][field] = value;
      setLicenseData(newLicenseData);
      onChange(Object.values(newLicenseData));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nederlandse Rijbewijzen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {DUTCH_LICENSE_TYPES.map((licenseType) => {
            const hasLicense = licenseData[licenseType.code];
            return (
              <div key={licenseType.code} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`license-${licenseType.code}`}
                    checked={!!hasLicense}
                    onCheckedChange={(checked) => handleLicenseToggle(licenseType.code, !!checked)}
                  />
                  <Label htmlFor={`license-${licenseType.code}`} className="font-medium">
                    {licenseType.code} - {licenseType.description}
                  </Label>
                </div>
                
                {hasLicense && (
                  <div className="ml-6 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm">Afgiftedatum</Label>
                      <Input
                        type="date"
                        value={hasLicense.startDate}
                        onChange={(e) => handleDateChange(licenseType.code, 'startDate', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Vervaldatum</Label>
                      <Input
                        type="date"
                        value={hasLicense.expiryDate}
                        onChange={(e) => handleDateChange(licenseType.code, 'expiryDate', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
