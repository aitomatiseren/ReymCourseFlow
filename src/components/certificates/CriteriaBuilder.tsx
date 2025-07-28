import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X, Plus, Filter, Users, Building, Globe, Calendar as CalendarIcon2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ExemptionCriteria, useCriteriaOptions } from '@/hooks/useMassExemptions';

interface CriteriaBuilderProps {
  criteria: ExemptionCriteria;
  onChange: (criteria: ExemptionCriteria) => void;
  className?: string;
}

export const CriteriaBuilder: React.FC<CriteriaBuilderProps> = ({
  criteria,
  onChange,
  className
}) => {
  const { data: options, isLoading: optionsLoading } = useCriteriaOptions();

  const updateCriteria = (updates: Partial<ExemptionCriteria>) => {
    onChange({ ...criteria, ...updates });
  };

  const toggleArrayValue = (field: keyof ExemptionCriteria, value: string) => {
    const currentArray = (criteria[field] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    updateCriteria({ [field]: newArray.length > 0 ? newArray : undefined });
  };

  const removeArrayValue = (field: keyof ExemptionCriteria, value: string) => {
    const currentArray = (criteria[field] as string[]) || [];
    const newArray = currentArray.filter(v => v !== value);
    updateCriteria({ [field]: newArray.length > 0 ? newArray : undefined });
  };

  const clearCriteria = () => {
    onChange({});
  };

  const criteriaCount = Object.values(criteria).filter(v => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : true)).length;

  if (optionsLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <CardTitle>Employee Selection Criteria</CardTitle>
          {criteriaCount > 0 && (
            <Badge variant="secondary">
              {criteriaCount} filter{criteriaCount !== 1 ? 's' : ''} active
            </Badge>
          )}
        </div>
        {criteriaCount > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearCriteria}
            className="text-red-600 hover:text-red-700"
          >
            Clear All
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Organizational Criteria */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Building className="h-4 w-4" />
            Organizational Structure
          </div>
          
          {/* Departments */}
          <div className="space-y-2">
            <Label>Departments</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {options?.departments.map(dept => (
                <div key={dept} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dept-${dept}`}
                    checked={criteria.departments?.includes(dept) || false}
                    onCheckedChange={() => toggleArrayValue('departments', dept)}
                  />
                  <Label htmlFor={`dept-${dept}`} className="text-sm">{dept}</Label>
                </div>
              ))}
            </div>
            {criteria.departments?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {criteria.departments.map(dept => (
                  <Badge key={dept} variant="secondary" className="text-xs">
                    {dept}
                    <button
                      onClick={() => removeArrayValue('departments', dept)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Contract Types */}
          <div className="space-y-2">
            <Label>Contract Types</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {options?.contractTypes.map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`contract-${type}`}
                    checked={criteria.contract_types?.includes(type) || false}
                    onCheckedChange={() => toggleArrayValue('contract_types', type)}
                  />
                  <Label htmlFor={`contract-${type}`} className="text-sm">{type}</Label>
                </div>
              ))}
            </div>
            {criteria.contract_types?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {criteria.contract_types.map(type => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}
                    <button
                      onClick={() => removeArrayValue('contract_types', type)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Geographic Criteria */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Globe className="h-4 w-4" />
            Location
          </div>

          {/* Cities (temporarily labeled as Hub Locations) */}
          <div className="space-y-2">
            <Label>Hub Locations</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {options?.cities.map(city => (
                <div key={city} className="flex items-center space-x-2">
                  <Checkbox
                    id={`city-${city}`}
                    checked={criteria.cities?.includes(city) || false}
                    onCheckedChange={() => toggleArrayValue('cities', city)}
                  />
                  <Label htmlFor={`city-${city}`} className="text-sm">{city}</Label>
                </div>
              ))}
            </div>
            {criteria.cities?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {criteria.cities.map(city => (
                  <Badge key={city} variant="secondary" className="text-xs">
                    {city}
                    <button
                      onClick={() => removeArrayValue('cities', city)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Date & Service Criteria */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Clock className="h-4 w-4" />
            Employment History
          </div>

          {/* Hire Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hired After</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !criteria.hire_date_from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {criteria.hire_date_from ? (
                      format(new Date(criteria.hire_date_from), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={criteria.hire_date_from ? new Date(criteria.hire_date_from) : undefined}
                    onSelect={(date) => updateCriteria({ hire_date_from: date ? format(date, 'yyyy-MM-dd') : undefined })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Hired Before</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !criteria.hire_date_to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {criteria.hire_date_to ? (
                      format(new Date(criteria.hire_date_to), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={criteria.hire_date_to ? new Date(criteria.hire_date_to) : undefined}
                    onSelect={(date) => updateCriteria({ hire_date_to: date ? format(date, 'yyyy-MM-dd') : undefined })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Service Years */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum Years of Service</Label>
              <Input
                type="number"
                min="0"
                max="50"
                placeholder="e.g., 2"
                value={criteria.min_service_years || ''}
                onChange={(e) => updateCriteria({ 
                  min_service_years: e.target.value ? parseInt(e.target.value) : undefined 
                })}
              />
            </div>

            <div className="space-y-2">
              <Label>Maximum Years of Service</Label>
              <Input
                type="number"
                min="0"
                max="50"
                placeholder="e.g., 10"
                value={criteria.max_service_years || ''}
                onChange={(e) => updateCriteria({ 
                  max_service_years: e.target.value ? parseInt(e.target.value) : undefined 
                })}
              />
            </div>
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Users className="h-4 w-4" />
            Additional Filters
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="exclude-existing"
              checked={criteria.exclude_existing_exemptions || false}
              onCheckedChange={(checked) => updateCriteria({ 
                exclude_existing_exemptions: checked || undefined 
              })}
            />
            <Label htmlFor="exclude-existing" className="text-sm">
              Exclude employees with existing exemptions for this certificate
            </Label>
          </div>
        </div>

        {/* Criteria Summary */}
        {criteriaCount > 0 && (
          <div className="border-t pt-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Active Filters Summary:</div>
            <div className="text-sm text-gray-600 space-y-1">
              {criteria.departments?.length > 0 && (
                <div>• Departments: {criteria.departments.join(', ')}</div>
              )}
              {criteria.contract_types?.length > 0 && (
                <div>• Contract Types: {criteria.contract_types.join(', ')}</div>
              )}
              {criteria.cities?.length > 0 && (
                <div>• Hub Locations: {criteria.cities.join(', ')}</div>
              )}
              {criteria.hire_date_from && (
                <div>• Hired after: {format(new Date(criteria.hire_date_from), 'PPP')}</div>
              )}
              {criteria.hire_date_to && (
                <div>• Hired before: {format(new Date(criteria.hire_date_to), 'PPP')}</div>
              )}
              {criteria.min_service_years && (
                <div>• Minimum service: {criteria.min_service_years} years</div>
              )}
              {criteria.max_service_years && (
                <div>• Maximum service: {criteria.max_service_years} years</div>
              )}
              {criteria.exclude_existing_exemptions && (
                <div>• Excluding employees with existing exemptions</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};