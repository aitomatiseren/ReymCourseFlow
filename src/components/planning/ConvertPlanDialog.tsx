import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePreliminaryPlanningMutations } from "@/hooks/usePreliminaryPlanning";
import { PreliminaryPlan } from "@/hooks/usePreliminaryPlanning";

interface ConvertPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PreliminaryPlan | null;
  trainingCount?: number;
  participantCount?: number;
}

export function ConvertPlanDialog({
  open,
  onOpenChange,
  plan,
  trainingCount = 0,
  participantCount = 0
}: ConvertPlanDialogProps) {
  const { t } = useTranslation(['planning']);
  const { toast } = useToast();
  const [skipEmptyGroups, setSkipEmptyGroups] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  
  const { convertPlanToDefinitive } = usePreliminaryPlanningMutations();

  const handleConvert = async () => {
    if (!plan) return;

    setIsConverting(true);
    try {
      const result = await convertPlanToDefinitive.mutateAsync({
        planId: plan.id,
        convertOptions: {
          skipEmptyGroups
        }
      });

      toast({
        title: t('planning:conversion.success.title'),
        description: t('planning:conversion.success.description', { 
          count: result.createdTrainings.length 
        }),
      });

      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: t('planning:conversion.error.title'),
        description: error instanceof Error ? error.message : t('planning:conversion.error.description'),
        variant: "destructive"
      });
    } finally {
      setIsConverting(false);
    }
  };

  if (!plan) return null;

  const canConvert = plan.status === 'approved';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('planning:conversion.dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('planning:conversion.dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Plan Summary */}
          <div className="space-y-2">
            <h4 className="font-medium">{t('planning:conversion.dialog.planSummary')}</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('planning:conversion.dialog.planName')}</span>
                <span className="font-medium">{plan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('planning:conversion.dialog.status')}</span>
                <span className="font-medium capitalize">{plan.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('planning:conversion.dialog.trainings')}</span>
                <span className="font-medium">{trainingCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('planning:conversion.dialog.participants')}</span>
                <span className="font-medium">{participantCount}</span>
              </div>
            </div>
          </div>

          {/* Status Check */}
          {!canConvert && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('planning:conversion.dialog.notApproved')}</AlertTitle>
              <AlertDescription>
                {t('planning:conversion.dialog.notApprovedDescription')}
              </AlertDescription>
            </Alert>
          )}

          {/* Conversion Options */}
          {canConvert && (
            <>
              <div className="space-y-2">
                <h4 className="font-medium">{t('planning:conversion.dialog.options')}</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="skipEmpty" 
                      checked={skipEmptyGroups}
                      onCheckedChange={(checked) => setSkipEmptyGroups(checked as boolean)}
                    />
                    <Label htmlFor="skipEmpty" className="flex-1">
                      <div>{t('planning:conversion.dialog.skipEmptyGroups')}</div>
                      <div className="text-sm text-gray-500">
                        {t('planning:conversion.dialog.skipEmptyGroupsDescription')}
                      </div>
                    </Label>
                  </div>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>{t('planning:conversion.dialog.important')}</AlertTitle>
                <AlertDescription>
                  {t('planning:conversion.dialog.importantDescription')}
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConverting}
          >
            {t('common:actions.cancel')}
          </Button>
          <Button
            onClick={handleConvert}
            disabled={!canConvert || isConverting}
          >
            {isConverting ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                {t('planning:conversion.dialog.converting')}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('planning:conversion.dialog.convertToDefinitive')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}