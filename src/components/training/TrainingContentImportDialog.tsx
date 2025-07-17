import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  Image, 
  Calendar, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Download
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
  const [activeTab, setActiveTab] = useState("text");
  const [textContent, setTextContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedTrainingData | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const extractor = new TrainingContentExtractor();

  const handleTextExtraction = useCallback(async () => {
    if (!textContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to extract training information from.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const input: TrainingContentInput = {
        type: 'text',
        content: textContent
      };
      
      const data = await extractor.extractTrainingContent(input);
      setExtractedData(data);
      setPreviewMode(true);
    } catch (error) {
      console.error('Error extracting from text:', error);
      toast({
        title: "Extraction Failed",
        description: "Failed to extract training information from text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [textContent, extractor, toast]);

  const handleFileUpload = useCallback(async (file: File, type: 'outlook' | 'file') => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const content = await readFileContent(file);
      const input: TrainingContentInput = {
        type,
        content,
        fileName: file.name,
        fileType: file.type
      };
      
      const data = await extractor.extractTrainingContent(input);
      setExtractedData(data);
      setPreviewMode(true);
    } catch (error) {
      console.error('Error extracting from file:', error);
      toast({
        title: "Extraction Failed",
        description: `Failed to extract training information from ${file.name}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [extractor, toast]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const base64Content = await readFileAsBase64(file);
      const input: TrainingContentInput = {
        type: 'image',
        content: base64Content,
        fileName: file.name,
        fileType: file.type
      };
      
      const data = await extractor.extractTrainingContent(input);
      setExtractedData(data);
      setPreviewMode(true);
    } catch (error) {
      console.error('Error extracting from image:', error);
      toast({
        title: "Extraction Failed",
        description: `Failed to extract training information from image. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [extractor, toast]);

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
    
    // Determine file type and handle accordingly
    if (file.type.startsWith('image/')) {
      await handleImageUpload(file);
    } else if (file.type === 'text/calendar' || file.name.endsWith('.ics') || 
               file.name.endsWith('.msg') || file.name.endsWith('.eml')) {
      await handleFileUpload(file, 'outlook');
    } else {
      await handleFileUpload(file, 'file');
    }
  }, [handleImageUpload, handleFileUpload]);

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
    if (extractedData) {
      onImport(extractedData);
      
      // Close the dialog after a brief delay to let user see the import happened
      setTimeout(() => {
        onOpenChange(false);
        setExtractedData(null);
        setPreviewMode(false);
        setTextContent("");
      }, 500);
      
      toast({
        title: "Training Content Imported",
        description: "Training information has been successfully imported and pre-filled. Check the training form to see the imported data.",
      });
    }
  };

  const handleReset = () => {
    setExtractedData(null);
    setPreviewMode(false);
    setTextContent("");
    setDragActive(false);
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="outlook">Outlook</TabsTrigger>
            <TabsTrigger value="file">File</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="text-content">
                Paste training information, meeting details, or course descriptions
              </Label>
              <Textarea
                id="text-content"
                placeholder="Paste your training content here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="min-h-[200px] resize-none"
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
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div className="space-y-3">
              <Label>Upload training screenshots, course schedules, or meeting invitations</Label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Image className={`mx-auto h-12 w-12 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isProcessing}
                    className="mx-auto"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image
                  </Button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  PNG, JPG, GIF up to 10MB
                </p>
                <p className={`text-xs mt-1 ${dragActive ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>
                  {dragActive ? 'Drop image files here' : 'Or drag and drop image files here'}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="outlook" className="space-y-4">
            <div className="space-y-3">
              <Label>Upload Outlook calendar items or meeting invitations</Label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Calendar className={`mx-auto h-12 w-12 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="mx-auto"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Outlook Item
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".ics,.msg,.eml,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'outlook');
                    }}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  .ics, .msg, .eml, or .txt files
                </p>
                <p className={`text-xs mt-1 ${dragActive ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>
                  {dragActive ? 'Drop calendar files here' : 'Or drag and drop calendar files here'}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div className="space-y-3">
              <Label>Upload training documents or course materials</Label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <FileText className={`mx-auto h-12 w-12 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="mx-auto"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.pdf,.doc,.docx,.rtf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'file');
                    }}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  .txt, .pdf, .doc, .docx, .rtf files
                </p>
                <p className={`text-xs mt-1 ${dragActive ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>
                  {dragActive ? 'Drop document files here' : 'Or drag and drop document files here'}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {isProcessing && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Processing content...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}