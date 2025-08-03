import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  RefreshCw, 
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  XCircle,
  Globe,
  FileText,
  Eye
} from "lucide-react";
import { useProviders } from "@/hooks/useProviders";

export interface ProviderScheduleSlot {
  id: string;
  providerId: string;
  courseType: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  availableSpots: number;
  cost: number;
  currency: string;
  status: 'available' | 'limited' | 'full' | 'cancelled';
  scheduleType: 'fixed' | 'on_demand' | 'flexible';
  bookingDeadline?: string;
  minimumParticipants?: number;
  notes?: string;
  lastUpdated: string;
  source: 'manual' | 'api' | 'scraper' | 'import';
}

export interface ProviderScheduleConfig {
  providerId: string;
  scheduleSource: 'manual' | 'api' | 'scraper' | 'import';
  apiEndpoint?: string;
  apiKey?: string;
  scraperUrl?: string;
  updateFrequency: 'manual' | 'hourly' | 'daily' | 'weekly';
  lastSync?: string;
  isActive: boolean;
  notes?: string;
}

interface ProviderScheduleManagerProps {
  providerId: string;
  courseId?: string;
  onScheduleSelect?: (slot: ProviderScheduleSlot) => void;
  readonly?: boolean;
}

export function ProviderScheduleManager({
  providerId,
  courseId,
  onScheduleSelect,
  readonly = false
}: ProviderScheduleManagerProps) {
  const { t } = useTranslation(['providers', 'training']);
  const { data: providers = [] } = useProviders();
  
  const [scheduleSlots, setScheduleSlots] = useState<ProviderScheduleSlot[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState<ProviderScheduleConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'config'>('list');

  const provider = providers.find(p => p.id === providerId);

  useEffect(() => {
    loadProviderSchedule();
    loadScheduleConfig();
  }, [providerId]);

  const loadProviderSchedule = async () => {
    setLoading(true);
    try {
      // For now, generate mock schedule data
      // In real implementation, this would call the appropriate API/scraper
      const mockSlots: ProviderScheduleSlot[] = generateMockScheduleSlots(providerId);
      setScheduleSlots(mockSlots);
    } catch (error) {
      console.error('Error loading provider schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScheduleConfig = async () => {
    // Load configuration for this provider
    // For now, use mock data
    const mockConfig: ProviderScheduleConfig = {
      providerId,
      scheduleSource: 'scraper',
      scraperUrl: provider?.website || '',
      updateFrequency: 'daily',
      lastSync: new Date().toISOString(),
      isActive: true,
      notes: 'Automatically synced from provider website'
    };
    setScheduleConfig(mockConfig);
  };

  const generateMockScheduleSlots = (providerId: string): ProviderScheduleSlot[] => {
    const slots: ProviderScheduleSlot[] = [];
    const startDate = new Date();
    
    // Generate slots for the next 60 days
    for (let i = 0; i < 60; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Skip weekends for some providers
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Random number of slots per day (0-3)
      const slotsPerDay = Math.floor(Math.random() * 4);
      
      for (let j = 0; j < slotsPerDay; j++) {
        const startHour = 8 + (j * 3); // Spread throughout the day
        const maxParticipants = Math.floor(Math.random() * 20) + 5;
        const availableSpots = Math.floor(Math.random() * maxParticipants);
        
        slots.push({
          id: `slot-${providerId}-${i}-${j}`,
          providerId,
          courseType: ['Safety Training', 'VCA', 'BHV', 'Forklift', 'Crane Operation'][Math.floor(Math.random() * 5)],
          date: date.toISOString().split('T')[0],
          startTime: `${startHour.toString().padStart(2, '0')}:00`,
          endTime: `${(startHour + 3).toString().padStart(2, '0')}:00`,
          location: provider?.locations?.[0]?.address || 'Provider Location',
          maxParticipants,
          availableSpots,
          cost: Math.floor(Math.random() * 500) + 200,
          currency: 'EUR',
          status: availableSpots > maxParticipants * 0.5 ? 'available' : 
                   availableSpots > 0 ? 'limited' : 'full',
          scheduleType: Math.random() > 0.7 ? 'on_demand' : 'fixed',
          minimumParticipants: Math.floor(maxParticipants * 0.3),
          lastUpdated: new Date().toISOString(),
          source: 'scraper'
        });
      }
    }
    
    return slots.sort((a, b) => new Date(a.date + ' ' + a.startTime).getTime() - new Date(b.date + ' ' + b.startTime).getTime());
  };

  const refreshSchedule = async () => {
    setLoading(true);
    
    if (scheduleConfig?.scheduleSource === 'scraper' && scheduleConfig.scraperUrl) {
      // Simulate scraping delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    await loadProviderSchedule();
    
    // Update last sync time
    if (scheduleConfig) {
      setScheduleConfig({
        ...scheduleConfig,
        lastSync: new Date().toISOString()
      });
    }
  };

  const getStatusBadge = (status: ProviderScheduleSlot['status']) => {
    switch (status) {
      case 'available':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Available</Badge>;
      case 'limited':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Limited</Badge>;
      case 'full':
        return <Badge variant="outline" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Full</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getSourceIcon = (source: ProviderScheduleSlot['source']) => {
    switch (source) {
      case 'api': return <Globe className="w-4 h-4" />;
      case 'scraper': return <Download className="w-4 h-4" />;
      case 'import': return <Upload className="w-4 h-4" />;
      case 'manual': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const filteredSlots = scheduleSlots.filter(slot => {
    if (selectedDate) {
      const slotDate = new Date(slot.date);
      const filterDate = new Date(selectedDate);
      if (slotDate.toDateString() !== filterDate.toDateString()) {
        return false;
      }
    }
    
    if (courseId) {
      // Filter by course type if courseId is provided
      // This would be enhanced with proper course matching
      return true;
    }
    
    return true;
  });

  if (!provider) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Provider not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Schedule Manager - {provider.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshSchedule}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Schedule List</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div>
                <Label htmlFor="date-filter">Filter by Date</Label>
                <Input
                  id="date-filter"
                  type="date"
                  value={selectedDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                />
              </div>
              <div className="text-sm text-gray-600">
                Showing {filteredSlots.length} of {scheduleSlots.length} slots
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Loading schedule data...</p>
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No schedule slots available</p>
                <p className="text-xs">Try refreshing or selecting a different date</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSlots.map((slot) => (
                  <Card key={slot.id} className="border-l-4 border-l-blue-200 hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">{slot.courseType}</h4>
                            {getStatusBadge(slot.status)}
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              {getSourceIcon(slot.source)}
                              <span>{slot.source}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              {new Date(slot.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {slot.startTime} - {slot.endTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {slot.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {slot.availableSpots}/{slot.maxParticipants} spots
                            </div>
                          </div>

                          <div className="mt-2 text-sm">
                            <span className="font-medium">€{slot.cost}</span>
                            {slot.scheduleType === 'on_demand' && (
                              <span className="ml-2 text-blue-600">(On-demand scheduling)</span>
                            )}
                            {slot.minimumParticipants && (
                              <span className="ml-2 text-gray-500">
                                Min. {slot.minimumParticipants} participants
                              </span>
                            )}
                          </div>
                        </div>

                        {onScheduleSelect && !readonly && slot.status !== 'full' && (
                          <Button
                            size="sm"
                            onClick={() => onScheduleSelect(slot)}
                            disabled={slot.status === 'cancelled'}
                          >
                            Select Slot
                          </Button>
                        )}
                      </div>

                      {slot.notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                          <strong>Notes:</strong> {slot.notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </div>
              <div className="lg:col-span-2">
                {selectedDate && (
                  <div>
                    <h3 className="font-medium mb-3">
                      Schedule for {selectedDate.toLocaleDateString()}
                    </h3>
                    <div className="space-y-2">
                      {filteredSlots.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{slot.courseType}</div>
                            <div className="text-sm text-gray-600">
                              {slot.startTime} - {slot.endTime} • {slot.availableSpots}/{slot.maxParticipants} spots
                            </div>
                          </div>
                          {getStatusBadge(slot.status)}
                        </div>
                      ))}
                      {filteredSlots.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No slots available for this date</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            {scheduleConfig && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Schedule Source</Label>
                    <Select 
                      value={scheduleConfig.scheduleSource} 
                      onValueChange={(value) => setScheduleConfig({
                        ...scheduleConfig,
                        scheduleSource: value as any
                      })}
                      disabled={readonly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Entry</SelectItem>
                        <SelectItem value="api">API Integration</SelectItem>
                        <SelectItem value="scraper">Website Scraper</SelectItem>
                        <SelectItem value="import">File Import</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Update Frequency</Label>
                    <Select 
                      value={scheduleConfig.updateFrequency}
                      onValueChange={(value) => setScheduleConfig({
                        ...scheduleConfig,
                        updateFrequency: value as any
                      })}
                      disabled={readonly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {scheduleConfig.scheduleSource === 'api' && (
                  <div className="space-y-3">
                    <div>
                      <Label>API Endpoint</Label>
                      <Input
                        value={scheduleConfig.apiEndpoint || ''}
                        onChange={(e) => setScheduleConfig({
                          ...scheduleConfig,
                          apiEndpoint: e.target.value
                        })}
                        placeholder="https://api.provider.com/schedule"
                        disabled={readonly}
                      />
                    </div>
                    <div>
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        value={scheduleConfig.apiKey || ''}
                        onChange={(e) => setScheduleConfig({
                          ...scheduleConfig,
                          apiKey: e.target.value
                        })}
                        placeholder="Enter API key"
                        disabled={readonly}
                      />
                    </div>
                  </div>
                )}

                {scheduleConfig.scheduleSource === 'scraper' && (
                  <div>
                    <Label>Website URL</Label>
                    <Input
                      value={scheduleConfig.scraperUrl || ''}
                      onChange={(e) => setScheduleConfig({
                        ...scheduleConfig,
                        scraperUrl: e.target.value
                      })}
                      placeholder="https://provider.com/schedule"
                      disabled={readonly}
                    />
                  </div>
                )}

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={scheduleConfig.notes || ''}
                    onChange={(e) => setScheduleConfig({
                      ...scheduleConfig,
                      notes: e.target.value
                    })}
                    placeholder="Configuration notes..."
                    disabled={readonly}
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Status</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Last Sync:</span>
                      <p className="font-medium">
                        {scheduleConfig.lastSync ? new Date(scheduleConfig.lastSync).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <p className={`font-medium ${scheduleConfig.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {scheduleConfig.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>

                {!readonly && (
                  <div className="flex gap-2">
                    <Button onClick={refreshSchedule} disabled={loading}>
                      Test & Sync Now
                    </Button>
                    <Button variant="outline">
                      Save Configuration
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}