import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarIcon, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  Settings, 
  Save, 
  Play,
  FileText,
  Clock,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useLicenses } from '@/hooks/useCertificates';
import { 
  useMassExemptionManagement, 
  useMassExemptionTemplates,
  ExemptionCriteria, 
  MassExemptionRequest,
  AutoExemptionRuleRequest
} from '@/hooks/useMassExemptions';
import { CriteriaBuilder } from './CriteriaBuilder';
import { EmployeePreview } from './EmployeePreview';
import { toast } from '@/hooks/use-toast';

interface MassExemptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledLicenseId?: string;
  onSuccess?: (result: any) => void;
}

export const MassExemptionDialog: React.FC<MassExemptionDialogProps> = ({
  open,
  onOpenChange,
  prefilledLicenseId,
  onSuccess
}) => {
  const { data: licenses } = useLicenses();
  const { data: templates } = useMassExemptionTemplates({ isActive: true });
  const { executeMassExemption, saveTemplate, createAutoExemptionRule } = useMassExemptionManagement();

  const [activeTab, setActiveTab] = useState('criteria');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [affectedEmployeeCount, setAffectedEmployeeCount] = useState(0);
  
  const [formData, setFormData] = useState<MassExemptionRequest>({
    licenseId: prefilledLicenseId || '',
    criteria: {},
    exemptionType: 'temporary',
    reason: '',
    justification: '',
    effectiveDate: format(new Date(), 'yyyy-MM-dd'),
    expiryDate: '',
    saveAsTemplate: false
  });

  const [autoRuleSettings, setAutoRuleSettings] = useState({
    createAutoRule: false,
    name: '',
    description: '',
    effectiveDateOffset: 0,
    durationDays: ''
  });

  const [templateData, setTemplateData] = useState({
    name: '',
    description: ''
  });

  const updateFormData = useCallback((updates: Partial<MassExemptionRequest>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const loadTemplate = useCallback((templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (!template) return;

    setFormData(prev => ({
      ...prev,
      templateId,
      templateName: template.name,
      criteria: template.criteria as ExemptionCriteria,
      exemptionType: template.exemption_type as any,
      reason: template.default_reason || prev.reason,
      justification: template.default_justification || prev.justification,
      expiryDate: template.default_duration_days 
        ? format(new Date(Date.now() + template.default_duration_days * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
        : prev.expiryDate
    }));

    toast({
      title: "Template Loaded",
      description: `Applied template "${template.name}" with predefined criteria.`
    });
  }, [templates]);

  const clearTemplate = useCallback(() => {
    setSelectedTemplate('');
    setFormData(prev => ({
      licenseId: prev.licenseId,
      criteria: {},
      exemptionType: 'temporary',
      reason: '',
      justification: '',
      effectiveDate: format(new Date(), 'yyyy-MM-dd'),
      expiryDate: '',
      saveAsTemplate: false
    }));
  }, []);

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.licenseId) errors.push('Certificate selection is required');
    if (Object.keys(formData.criteria).length === 0) errors.push('At least one criteria must be selected');
    if (!formData.reason.trim()) errors.push('Reason is required');
    if (!formData.effectiveDate) errors.push('Effective date is required');
    
    if (formData.exemptionType === 'temporary' && !formData.expiryDate) {
      errors.push('Expiry date is required for temporary exemptions');
    }

    if (formData.expiryDate && formData.effectiveDate) {
      const effectiveDate = new Date(formData.effectiveDate);
      const expiryDate = new Date(formData.expiryDate);
      if (expiryDate <= effectiveDate) {
        errors.push('Expiry date must be after effective date');
      }
    }

    if (affectedEmployeeCount === 0) {
      errors.push('No employees match the selected criteria');
    }

    if (formData.saveAsTemplate && !templateData.name.trim()) {
      errors.push('Template name is required when saving as template');
    }

    if (autoRuleSettings.createAutoRule && !autoRuleSettings.name.trim()) {
      errors.push('Auto-rule name is required when creating auto-exemption rule');
    }

    if (autoRuleSettings.createAutoRule && formData.exemptionType === 'temporary' && !autoRuleSettings.durationDays) {
      errors.push('Duration is required for temporary auto-exemption rules');
    }

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: errors.join(', ')
      });
      return;
    }

    try {
      const request: MassExemptionRequest = {
        ...formData,
        templateName: formData.saveAsTemplate ? templateData.name : formData.templateName
      };

      // Create auto-exemption rule if requested
      if (autoRuleSettings.createAutoRule) {
        const autoRuleRequest: AutoExemptionRuleRequest = {
          name: autoRuleSettings.name,
          description: autoRuleSettings.description,
          licenseId: formData.licenseId,
          criteria: formData.criteria,
          exemptionType: formData.exemptionType,
          reason: formData.reason,
          justification: formData.justification,
          effectiveDateOffset: autoRuleSettings.effectiveDateOffset,
          durationDays: autoRuleSettings.durationDays ? parseInt(autoRuleSettings.durationDays) : undefined
        };

        await createAutoExemptionRule.mutateAsync(autoRuleRequest);
        
        toast({
          title: "Auto-Exemption Rule Created",
          description: `Rule "${autoRuleSettings.name}" will automatically apply exemptions to matching employees.`
        });
      }

      const result = await executeMassExemption.mutateAsync(request);

      toast({
        title: "Mass Exemption Created",
        description: `Successfully processed ${result.result.success_count} exemptions for ${affectedEmployeeCount} employees.`
      });

      if (onSuccess) {
        onSuccess(result);
      }

      onOpenChange(false);
      
      // Reset form
      setFormData({
        licenseId: prefilledLicenseId || '',
        criteria: {},
        exemptionType: 'temporary',
        reason: '',
        justification: '',
        effectiveDate: format(new Date(), 'yyyy-MM-dd'),
        expiryDate: '',
        saveAsTemplate: false
      });
      setTemplateData({ name: '', description: '' });
      setAutoRuleSettings({
        createAutoRule: false,
        name: '',
        description: '',
        effectiveDateOffset: 0,
        durationDays: ''
      });
      setSelectedTemplate('');
      setActiveTab('criteria');

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Mass Exemption Failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
  };

  const selectedLicense = licenses?.find(l => l.id === formData.licenseId);
  const formErrors = validateForm();
  const canProceed = formErrors.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Mass Exemption
            {selectedLicense && (
              <Badge variant="outline" className="ml-2">
                {selectedLicense.name}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Create exemptions for multiple employees based on customizable criteria.
            {affectedEmployeeCount > 0 && (
              <span className="font-medium text-blue-600 ml-2">
                {affectedEmployeeCount} employee{affectedEmployeeCount !== 1 ? 's' : ''} will be affected
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
              <TabsTrigger value="criteria" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Criteria
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Preview ({affectedEmployeeCount})
              </TabsTrigger>
              <TabsTrigger value="exemption" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Exemption Details
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Templates
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden mt-4 min-h-0">
              <TabsContent value="criteria" className="mt-0 h-full overflow-y-auto">
                <div className="space-y-4 pb-6 pr-2">
                  {/* Certificate Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="certificate">Certificate *</Label>
                    <div className="w-full">
                      <Select 
                        value={formData.licenseId} 
                        onValueChange={(value) => updateFormData({ licenseId: value })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select certificate to create exemptions for" />
                        </SelectTrigger>
                        <SelectContent className="min-w-[400px] max-w-[600px]">
                          {licenses?.map(license => (
                            <SelectItem key={license.id} value={license.id}>
                              {license.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Criteria Builder */}
                  <CriteriaBuilder
                    criteria={formData.criteria}
                    onChange={(criteria) => updateFormData({ criteria })}
                    className="flex-shrink-0"
                  />
                </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-0 h-full overflow-y-auto">
                <div className="pb-6 pr-2">
                  <EmployeePreview
                    criteria={{ ...formData.criteria, license_id: formData.licenseId }}
                    onEmployeeCountChange={setAffectedEmployeeCount}
                  />
                </div>
              </TabsContent>

              <TabsContent value="exemption" className="mt-0 h-full overflow-y-auto">
                <div className="space-y-4 max-w-2xl pb-6 pr-2">
                  {/* Exemption Type */}
                  <div className="space-y-2">
                    <Label htmlFor="exemptionType">Exemption Type *</Label>
                    <Select 
                      value={formData.exemptionType} 
                      onValueChange={(value: 'permanent' | 'temporary' | 'conditional') => 
                        updateFormData({ exemptionType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="temporary">Temporary</SelectItem>
                        <SelectItem value="permanent">Permanent</SelectItem>
                        <SelectItem value="conditional">Conditional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Effective Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.effectiveDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.effectiveDate ? (
                              format(new Date(formData.effectiveDate), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.effectiveDate ? new Date(formData.effectiveDate) : undefined}
                            onSelect={(date) => updateFormData({ 
                              effectiveDate: date ? format(date, 'yyyy-MM-dd') : '' 
                            })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {(formData.exemptionType === 'temporary' || formData.exemptionType === 'conditional') && (
                      <div className="space-y-2">
                        <Label>Expiry Date {formData.exemptionType === 'temporary' ? '*' : ''}</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.expiryDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.expiryDate ? (
                                format(new Date(formData.expiryDate), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.expiryDate ? new Date(formData.expiryDate) : undefined}
                              onSelect={(date) => updateFormData({ 
                                expiryDate: date ? format(date, 'yyyy-MM-dd') : '' 
                              })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>

                  {/* Reason */}
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason *</Label>
                    <Textarea
                      id="reason"
                      placeholder="Enter the reason for this mass exemption..."
                      value={formData.reason}
                      onChange={(e) => updateFormData({ reason: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* Justification */}
                  <div className="space-y-2">
                    <Label htmlFor="justification">Additional Justification</Label>
                    <Textarea
                      id="justification"
                      placeholder="Provide additional justification if needed..."
                      value={formData.justification}
                      onChange={(e) => updateFormData({ justification: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* Auto-Rule Settings */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="create-auto-rule"
                        checked={autoRuleSettings.createAutoRule}
                        onCheckedChange={(checked) => setAutoRuleSettings(prev => ({ ...prev, createAutoRule: checked }))}
                      />
                      <Label htmlFor="create-auto-rule" className="text-sm font-medium">
                        Create Auto-Exemption Rule
                      </Label>
                    </div>
                    <p className="text-sm text-gray-500">
                      Automatically apply this exemption to new employees and existing employees when their data changes to match the criteria.
                    </p>

                    {autoRuleSettings.createAutoRule && (
                      <div className="space-y-3 ml-6 border-l-2 border-blue-200 pl-4">
                        <div className="space-y-2">
                          <Label htmlFor="auto-rule-name">Auto-Rule Name *</Label>
                          <Input
                            id="auto-rule-name"
                            placeholder="e.g., 'Auto Safety Exemption for IT Department'"
                            value={autoRuleSettings.name}
                            onChange={(e) => setAutoRuleSettings(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="auto-rule-description">Description</Label>
                          <Textarea
                            id="auto-rule-description"
                            placeholder="Describe when this auto-rule should apply..."
                            value={autoRuleSettings.description}
                            onChange={(e) => setAutoRuleSettings(prev => ({ ...prev, description: e.target.value }))}
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="effective-offset">Effective Date Offset (days)</Label>
                            <Input
                              id="effective-offset"
                              type="number"
                              min="0"
                              max="365"
                              placeholder="0"
                              value={autoRuleSettings.effectiveDateOffset}
                              onChange={(e) => setAutoRuleSettings(prev => ({ 
                                ...prev, 
                                effectiveDateOffset: parseInt(e.target.value) || 0 
                              }))}
                            />
                            <p className="text-xs text-gray-500">Days after criteria is met when exemption becomes effective</p>
                          </div>
                          {formData.exemptionType === 'temporary' && (
                            <div className="space-y-2">
                              <Label htmlFor="duration-days">Duration (days)</Label>
                              <Input
                                id="duration-days"
                                type="number"
                                min="1"
                                max="3650"
                                placeholder="365"
                                value={autoRuleSettings.durationDays}
                                onChange={(e) => setAutoRuleSettings(prev => ({ 
                                  ...prev, 
                                  durationDays: e.target.value 
                                }))}
                              />
                              <p className="text-xs text-gray-500">How long the exemption lasts</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="templates" className="mt-0 h-full overflow-y-auto">
                <div className="space-y-4 pb-6 pr-2">
                  {/* Load Existing Template */}
                  <div className="space-y-2">
                    <Label>Load Existing Template</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={selectedTemplate} 
                        onValueChange={setSelectedTemplate}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Choose a saved template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {templates?.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              <div>
                                <div className="font-medium">{template.name}</div>
                                <div className="text-sm text-gray-500">
                                  {template.description || 'No description'}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="outline" 
                        onClick={() => selectedTemplate && loadTemplate(selectedTemplate)}
                        disabled={!selectedTemplate}
                      >
                        Load
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={clearTemplate}
                        disabled={!formData.templateId}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  {/* Save as Template */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="save-template"
                        checked={formData.saveAsTemplate}
                        onCheckedChange={(checked) => updateFormData({ saveAsTemplate: checked })}
                      />
                      <Label htmlFor="save-template" className="text-sm">
                        Save current configuration as a new template
                      </Label>
                    </div>

                    {formData.saveAsTemplate && (
                      <div className="space-y-3 ml-6">
                        <div className="space-y-2">
                          <Label htmlFor="template-name">Template Name *</Label>
                          <Input
                            id="template-name"
                            placeholder="e.g., 'IT Department Safety Exemptions'"
                            value={templateData.name}
                            onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="template-description">Description</Label>
                          <Textarea
                            id="template-description"
                            placeholder="Describe when this template should be used..."
                            value={templateData.description}
                            onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Template List */}
                  {templates?.length > 0 && (
                    <div className="space-y-2 border-t pt-4">
                      <Label>Available Templates</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {templates.map(template => (
                          <div key={template.id} className="p-3 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium text-sm">{template.name}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {template.description || 'No description'}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {template.exemption_type}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    Used {template.usage_count} times
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Validation Errors */}
        {formErrors.length > 0 && (
          <Alert variant="destructive" className="mt-4 flex-shrink-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Please fix the following issues:</div>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {formErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex items-center justify-between flex-shrink-0 mt-4">
          <div className="text-sm text-gray-500">
            {affectedEmployeeCount > 0 && (
              <>
                <CheckCircle2 className="h-4 w-4 inline mr-1 text-green-600" />
                Ready to process {affectedEmployeeCount} exemption{affectedEmployeeCount !== 1 ? 's' : ''}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!canProceed || executeMassExemption.isPending}
              className="min-w-32"
            >
              {executeMassExemption.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Create Exemptions
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};