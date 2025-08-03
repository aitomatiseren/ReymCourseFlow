import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle
} from "lucide-react";
import { TrainingContentExtractor, TrainingContentInput, ExtractedTrainingData } from "@/services/ai/training-content-extractor";

interface TrainingContentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ExtractedTrainingData) => void;
  title?: string;
}

export function TrainingContentImportDialog({
  open,
  onOpenChange,
  onImport,
  title = "Import Training Content"
}: TrainingContentImportDialogProps) {
  const [textContent, setTextContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedTrainingData | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("Processing content...");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const extractor = new TrainingContentExtractor();

  const handleContentExtraction = useCallback(async (inputType: 'text' | 'image' | 'outlook' | 'file', content: string, fileName?: string, fileType?: string) => {
    setIsProcessing(true);
    setProcessingMessage(
      inputType === 'text' ? "Analyzing text content..." :
      inputType === 'image' ? "Processing image with AI vision..." :
      inputType === 'outlook' ? "Extracting calendar information..." :
      "Reading document content..."
    );

    try {
      const input: TrainingContentInput = {
        type: inputType,
        content,
        fileName,
        fileType
      };
      
      const data = await extractor.extractTrainingContent(input);
      console.log('TrainingContentImportDialog - Extracted data from AI:', data);
      setExtractedData(data);
      setPreviewMode(true);
    } catch (error) {
      console.error(`Error extracting from ${inputType}:`, error);
      toast({
        title: "Extraction Failed",
        description: `Failed to extract training information from ${inputType === 'text' ? 'text' : fileName || 'content'}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [extractor, toast]);

  const handleTextExtraction = useCallback(async () => {
    if (!textContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to extract training information from.",
        variant: "destructive",
      });
      return;
    }

    await handleContentExtraction('text', textContent);
  }, [textContent, handleContentExtraction, toast]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    try {
      // Determine file type and processing method
      if (file.type.startsWith('image/')) {
        const base64Content = await readFileAsBase64(file);
        await handleContentExtraction('image', base64Content, file.name, file.type);
      } else if (file.type === 'text/calendar' || file.name.endsWith('.ics') || 
                 file.name.endsWith('.msg') || file.name.endsWith('.eml')) {
        const content = await readFileContent(file);
        await handleContentExtraction('outlook', content, file.name, file.type);
      } else {
        const content = await readFileContent(file);
        await handleContentExtraction('file', content, file.name, file.type);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Upload Failed",
        description: `Failed to process ${file.name}. Please try again.`,
        variant: "destructive",
      });
    }
  }, [handleContentExtraction, toast]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    await handleFileUpload(file);
  }, [handleFileUpload]);

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImport = () => {
    console.log('TrainingContentImportDialog - handleImport called with data:', extractedData);
    if (extractedData) {
      console.log('TrainingContentImportDialog - Calling onImport callback with data:', extractedData);
      onImport(extractedData);
      
      // Close the dialog after a brief delay to let user see the import happened
      setTimeout(() => {
        console.log('TrainingContentImportDialog - Closing dialog and resetting state');
        onOpenChange(false);
        setExtractedData(null);
        setPreviewMode(false);
        setTextContent("");
      }, 500);
      
      toast({
        title: "Training Content Imported",
        description: "Training information has been successfully imported and pre-filled. Check the training form to see the imported data.",
      });
    } else {
      console.error('TrainingContentImportDialog - No extracted data available for import');
    }
  };

  const handleReset = () => {
    setExtractedData(null);
    setPreviewMode(false);
    setTextContent("");
    setDragActive(false);
    setProcessingMessage("Processing content...");
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-100 text-green-800";
    if (confidence >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle className="h-4 w-4" />;
    if (confidence >= 60) return <AlertCircle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  if (previewMode && extractedData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Training Content Preview</DialogTitle>
            <DialogDescription>
              Review the extracted training information before importing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Confidence Badge */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={getConfidenceColor(extractedData.confidence || 50)}>
                {getConfidenceIcon(extractedData.confidence || 50)}
                {extractedData.confidence || 50}% confidence
              </Badge>
            </div>

            {/* Extracted Data Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {extractedData.title && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Title</Label>
                      <p className="text-sm mt-1">{extractedData.title}</p>
                    </div>
                  )}
                  {extractedData.description && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Description</Label>
                      <p className="text-sm mt-1">{extractedData.description}</p>
                    </div>
                  )}
                  {extractedData.course && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Course</Label>
                      <p className="text-sm mt-1">{extractedData.course}</p>
                    </div>
                  )}
                  {extractedData.provider && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Provider</Label>
                      <p className="text-sm mt-1">{extractedData.provider}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Schedule & Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {extractedData.startDate && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Start Date</Label>
                      <p className="text-sm mt-1">{extractedData.startDate}</p>
                    </div>
                  )}
                  {extractedData.startTime && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Start Time</Label>
                      <p className="text-sm mt-1">{extractedData.startTime}</p>
                    </div>
                  )}
                  {extractedData.endDate && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">End Date</Label>
                      <p className="text-sm mt-1">{extractedData.endDate}</p>
                    </div>
                  )}
                  {extractedData.endTime && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">End Time</Label>
                      <p className="text-sm mt-1">{extractedData.endTime}</p>
                    </div>
                  )}
                  {extractedData.location && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Location</Label>
                      <p className="text-sm mt-1">{extractedData.location}</p>
                    </div>
                  )}
                  {extractedData.meetingUrl && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Meeting URL</Label>
                      <p className="text-sm mt-1 break-all">{extractedData.meetingUrl}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Participants & Costs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {extractedData.instructor && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Instructor</Label>
                      <p className="text-sm mt-1">{extractedData.instructor}</p>
                    </div>
                  )}
                  {extractedData.maxParticipants && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Max Participants</Label>
                      <p className="text-sm mt-1">{extractedData.maxParticipants}</p>
                    </div>
                  )}
                  {extractedData.costs?.amount && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Cost</Label>
                      <p className="text-sm mt-1">{extractedData.costs.currency || 'EUR'} {extractedData.costs.amount}</p>
                    </div>
                  )}
                  {extractedData.participants && extractedData.participants.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Participants</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {extractedData.participants.map((participant, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {participant}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {extractedData.requirements && extractedData.requirements.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Requirements</Label>
                      <ul className="text-sm mt-1 list-disc list-inside">
                        {extractedData.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {extractedData.materials && extractedData.materials.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Materials</Label>
                      <ul className="text-sm mt-1 list-disc list-inside">
                        {extractedData.materials.map((material, index) => (
                          <li key={index}>{material}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {extractedData.notes && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Notes</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{extractedData.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sessions Information */}
            {extractedData.sessions && extractedData.sessions.length > 0 && (() => {
              // Group sessions by date for preview (same logic as in CreateTrainingDialog)
              const sessionsByDate = new Map<string, {
                formattedDate: string;
                startTime: string;
                endTime: string;
                details: string[];
                instructor?: string;
                location?: string;
              }>();
              
              extractedData.sessions.forEach((session, index) => {
                if (session.date) {
                  // Parse and format date
                  let formattedDate = session.date;
                  
                  if (formattedDate.includes('-') && formattedDate.split('-').length === 3) {
                    const parts = formattedDate.split('-');
                    if (parts[2].length === 4) {
                      // DD-MM-YYYY format -> YYYY-MM-DD 
                      formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    }
                  }
                  
                  const startTime = session.startTime ? (session.startTime.length === 5 ? session.startTime : session.startTime.substring(0, 5)) : '';
                  const endTime = session.endTime ? (session.endTime.length === 5 ? session.endTime : session.endTime.substring(0, 5)) : '';
                  
                  const sessionDetail = session.title || `Session ${index + 1}`;
                  const timeDetail = startTime && endTime ? ` (${startTime}-${endTime})` : startTime ? ` (${startTime})` : '';
                  const fullDetail = sessionDetail + timeDetail;
                  
                  if (sessionsByDate.has(formattedDate)) {
                    const existing = sessionsByDate.get(formattedDate)!;
                    existing.details.push(fullDetail);
                    
                    // Update start time to earliest
                    if (startTime && (!existing.startTime || startTime < existing.startTime)) {
                      existing.startTime = startTime;
                    }
                    
                    // Update end time to latest  
                    if (endTime && (!existing.endTime || endTime > existing.endTime)) {
                      existing.endTime = endTime;
                    }
                  } else {
                    sessionsByDate.set(formattedDate, {
                      formattedDate,
                      startTime: startTime || '',
                      endTime: endTime || '',
                      details: [fullDetail],
                      instructor: session.instructor,
                      location: session.location
                    });
                  }
                }
              });
              
              const groupedSessions = Array.from(sessionsByDate.values());
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Training Sessions ({groupedSessions.length} grouped from {extractedData.sessions.length} original)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {groupedSessions.map((groupedSession, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="md:col-span-3">
                            <Label className="text-xs font-medium text-gray-600">Session Details</Label>
                            <p className="mt-1 font-medium">{groupedSession.details.join(', ')}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Date</Label>
                            <p className="mt-1">{groupedSession.formattedDate}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Time</Label>
                            <p className="mt-1">{groupedSession.startTime}{groupedSession.endTime ? ` - ${groupedSession.endTime}` : ''}</p>
                          </div>
                          {groupedSession.instructor && (
                            <div>
                              <Label className="text-xs font-medium text-gray-600">Instructor</Label>
                              <p className="mt-1">{groupedSession.instructor}</p>
                            </div>
                          )}
                          {groupedSession.location && (
                            <div className="md:col-span-3">
                              <Label className="text-xs font-medium text-gray-600">Location</Label>
                              <p className="mt-1">{groupedSession.location}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleReset}>
                Back to Import
              </Button>
              <Button onClick={handleImport} className="bg-blue-600 hover:bg-blue-700">
                Import Training Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Import training information from text, images, Outlook items, or files. AI will extract and structure the data for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Text Input Section */}
          <div className="space-y-3">
            <Label htmlFor="text-content" className="text-base font-semibold">
              Paste Training Content
            </Label>
            <p className="text-sm text-gray-600">
              Paste training information, meeting details, course descriptions, or any text content
            </p>
            <Textarea
              id="text-content"
              placeholder="Paste your training content here...

Examples:
• Meeting invitations or calendar items
• Course descriptions or training announcements
• Email content about training sessions
• Any text containing training information"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="min-h-[150px] resize-none"
              disabled={isProcessing}
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleTextExtraction}
                disabled={isProcessing || !textContent.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Extract Training Info
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* File Upload Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Upload Files
            </Label>
            <p className="text-sm text-gray-600">
              Upload any file type - images, documents, calendar items, or Outlook files. AI will automatically detect and process the content.
            </p>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex justify-center mb-4">
                <Upload className={`h-12 w-12 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="mx-auto"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.ics,.msg,.eml,.txt,.pdf,.doc,.docx,.rtf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                />
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-500">
                  Supported: Images (PNG, JPG, GIF), Documents (PDF, DOC, TXT), Calendar files (ICS, MSG, EML)
                </p>
                <p className={`text-xs ${dragActive ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>
                  {dragActive ? 'Drop files here to upload' : 'Or drag and drop files here'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {isProcessing && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">{processingMessage}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}