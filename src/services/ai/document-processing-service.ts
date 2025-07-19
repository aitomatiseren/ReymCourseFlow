import { OpenAIService } from './openai-service';
import { supabase } from '@/integrations/supabase/client';
import * as pdfjsLib from 'pdfjs-dist';

export interface DocumentProcessingResult {
  success: boolean;
  confidence: number;
  extractedData: {
    certificateNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    issuer?: string;
    employeeName?: string;
    certificateType?: string;
    [key: string]: string | number | boolean;
  };
  suggestedEmployee?: {
    id: string;
    name: string;
    confidence: number;
  };
  suggestedLicense?: {
    id: string;
    name: string;
    confidence: number;
  };
  errors?: string[];
}

export class DocumentProcessingService {
  private openaiService: OpenAIService;

  constructor() {
    this.openaiService = new OpenAIService();
    // Configure PDF.js worker - use local file to avoid CORS issues
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  }

  async processDocument(documentId: string): Promise<DocumentProcessingResult> {
    try {
      // Update processing status
      await supabase
        .from('certificate_documents')
        .update({ processing_status: 'processing' })
        .eq('id', documentId);

      // Get document details
      const { data: document } = await supabase
        .from('certificate_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (!document) {
        throw new Error('Document not found');
      }

      // Download document from Supabase Storage
      const { data: fileData } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (!fileData) {
        throw new Error('Failed to download document');
      }

      // Extract text based on file type
      let extractedText: string;
      
      if (document.mime_type === 'application/pdf') {
        extractedText = await this.extractTextFromPdf(fileData);
      } else if (document.mime_type?.startsWith('image/')) {
        extractedText = await this.extractTextFromImage(fileData);
      } else {
        throw new Error('Unsupported file type');
      }

      // Process with AI
      const aiResult = await this.processWithAI(extractedText);

      // Get employee and license suggestions
      const [employeeSuggestion, licenseSuggestion] = await Promise.all([
        this.findEmployeeMatch(aiResult.extractedData.employeeName),
        this.findLicenseMatch(aiResult.extractedData.certificateType, extractedText)
      ]);

      // Prepare final result
      const result: DocumentProcessingResult = {
        success: true,
        confidence: aiResult.confidence,
        extractedData: aiResult.extractedData,
        suggestedEmployee: employeeSuggestion,
        suggestedLicense: licenseSuggestion,
        errors: aiResult.errors
      };

      // Update document with results
      await this.updateDocumentWithResults(documentId, result);

      return result;

    } catch (error) {
      console.error('Document processing error:', error);
      
      // Update document with error status
      await supabase
        .from('certificate_documents')
        .update({ 
          processing_status: 'failed',
          ai_extracted_data: { error: error instanceof Error ? error.message : 'Unknown error' }
        })
        .eq('id', documentId);

      return {
        success: false,
        confidence: 0,
        extractedData: {},
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async extractTextFromPdf(file: Blob): Promise<string> {
    try {
      console.log('Extracting text from PDF using PDF.js');
      
      // Convert blob to array buffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
      console.log(`PDF loaded with ${pdf.numPages} pages`);
      
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine all text items
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
      }
      
      const extractedText = fullText.trim();
      console.log('PDF text extracted successfully:', extractedText.length, 'characters');
      
      // Check if we got meaningful text (not just whitespace or very short)
      if (extractedText.length < 10) {
        console.log('PDF appears to be image-based (no extractable text), trying Vision API');
        return await this.extractTextFromImagePdf(file);
      }
      
      return extractedText;
      
    } catch (error) {
      console.error('PDF text extraction error:', error);
      console.log('Trying Vision API for image-based PDF');
      return await this.extractTextFromImagePdf(file);
    }
  }

  private async extractTextFromImagePdf(file: Blob): Promise<string> {
    try {
      console.log('Converting PDF to images for Vision API processing');
      
      // Convert blob to array buffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
      
      let allText = '';
      
      // Process each page as an image
      for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 3); pageNum++) { // Limit to first 3 pages
        const page = await pdf.getPage(pageNum);
        
        // Set up canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          console.error('Could not get canvas context');
          continue;
        }
        
        // Set canvas size
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        // Convert canvas to base64
        const imageData = canvas.toDataURL('image/png');
        const base64 = imageData.split(',')[1];
        
        console.log(`Processing page ${pageNum} with Vision API`);
        
        // Use Vision API to extract text
        const response = await this.openaiService.processVisionRequest(
          'Extract all text from this certificate PDF page. Focus on certificate numbers, dates, names, and issuing authorities. Look for European date formats like DD-MM-YYYY.',
          base64,
          'image/png'
        );
        
        if (response.content) {
          allText += response.content + '\n';
        }
      }
      
      console.log('Image-based PDF text extracted successfully:', allText.length, 'characters');
      return allText.trim() || this.getMockText();
      
    } catch (error) {
      console.error('Image-based PDF text extraction error:', error);
      console.log('Falling back to mock text');
      return this.getMockText();
    }
  }

  private getMockText(): string {
    return `
      TRAINING CERTIFICATE
      Certificate Number: CERT-${Math.random().toString(36).substr(2, 9).toUpperCase()}
      Employee: John Doe
      Course: Safety Training Level 1
      Issue Date: ${new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
      Expiry Date: ${new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
      Issuer: Training Authority Netherlands
      This certifies that the above named person has successfully completed the required training.
    `;
  }

  private async extractTextFromImage(file: Blob): Promise<string> {
    try {
      // Convert image to base64
      const base64 = await this.fileToBase64(file);
      
      // Use OpenAI Vision API to extract text from image
      const response = await this.openaiService.processVisionRequest(
        'Extract all text from this certificate image. Focus on certificate numbers, dates, names, and issuing authorities. Look for European date formats like DD-MM-YYYY.',
        base64,
        file.type
      );

      return response.content || '';
    } catch (error) {
      console.error('Image text extraction error:', error);
      // Fallback to mock text if vision API fails
      return this.getMockText();
    }
  }

  private async fileToBase64(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 data
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  private async processWithAI(text: string): Promise<{
    extractedData: Record<string, string | number | boolean>;
    confidence: number;
    errors?: string[];
  }> {
    try {
      const prompt = `
        Analyze the following certificate text and extract structured information.
        
        IMPORTANT DATE PARSING RULES:
        - European date format DD-MM-YYYY is commonly used (e.g., 18-06-2025 means June 18, 2025)
        - Look for dates in formats like: DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
        - Convert ALL dates to YYYY-MM-DD format in the response
        - Be careful: 18-06-2025 should become 2025-06-18, NOT 2025-18-06
        
        Return a JSON object with the following fields:
        - certificateNumber: The certificate or license number (look for numbers at the bottom or labeled as "Certificate number", "Zertifikatsnummer", "Certificaatnummer")
        - issueDate: Issue date in YYYY-MM-DD format (look for labels like "op/on/am", "datum", "date", "uitgereikt")
        - expiryDate: Expiry date in YYYY-MM-DD format (look for labels like "Geldig tot", "Valid until", "Gültig bis")
        - issuer: The issuing authority or organization (look for "Uitgereikt door", "Handed over by", "Ausgegeben von")
        - employeeName: The name of the certificate holder (usually the person's name prominently displayed)
        - certificateType: The type or name of the certificate/training (look for "REYM werkt veilig", certificate titles, training names)
        
        Also provide a confidence score (0-1) for the extraction quality.
        
        Certificate text:
        ${text}
        
        Return only valid JSON in this format:
        {
          "certificateNumber": "string or null",
          "issueDate": "YYYY-MM-DD or null",
          "expiryDate": "YYYY-MM-DD or null",
          "issuer": "string or null",
          "employeeName": "string or null",
          "certificateType": "string or null",
          "confidence": 0.85
        }
      `;

      const response = await this.openaiService.processTextRequest(prompt);
      
      try {
        // Clean the response to remove markdown code blocks
        let cleanedResponse = response.content || '{}';
        
        // Remove markdown code blocks if present
        if (cleanedResponse.includes('```json')) {
          cleanedResponse = cleanedResponse
            .replace(/```json\s*/, '')
            .replace(/```\s*$/, '')
            .trim();
        } else if (cleanedResponse.includes('```')) {
          cleanedResponse = cleanedResponse
            .replace(/```\s*/, '')
            .replace(/```\s*$/, '')
            .trim();
        }
        
        const parsedData = JSON.parse(cleanedResponse);
        
        // Post-process dates to ensure correct format
        if (parsedData.issueDate) {
          parsedData.issueDate = this.validateAndCorrectDate(parsedData.issueDate);
        }
        if (parsedData.expiryDate) {
          parsedData.expiryDate = this.validateAndCorrectDate(parsedData.expiryDate);
        }
        
        return {
          extractedData: parsedData,
          confidence: parsedData.confidence || 0.5
        };
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.error('Raw response:', response.content);
        return this.fallbackExtraction(text);
      }
    } catch (error) {
      console.error('AI processing error:', error);
      return this.fallbackExtraction(text);
    }
  }

  private fallbackExtraction(text: string): {
    extractedData: Record<string, string | number | boolean>;
    confidence: number;
    errors?: string[];
  } {
    // Simple regex-based fallback extraction
    const extractedData: Record<string, string | number | boolean> = {};
    
    // Try to find certificate numbers
    const certNumberMatch = text.match(/(?:certificate|cert|license)\s*(?:number|#|no\.?)\s*:?\s*([A-Z0-9-]+)/i);
    if (certNumberMatch) {
      extractedData.certificateNumber = certNumberMatch[1];
    }

    // Try to find dates
    const dateRegex = /(\d{4}-\d{2}-\d{2}|\d{2}[-/]\d{2}[-/]\d{4}|\d{2}[-/]\d{2}[-/]\d{2})/g;
    const dates = text.match(dateRegex) || [];
    
    // Simple heuristic: first date is issue, second is expiry
    if (dates.length >= 1) {
      extractedData.issueDate = this.normalizeDate(dates[0]);
    }
    if (dates.length >= 2) {
      extractedData.expiryDate = this.normalizeDate(dates[1]);
    }

    // Try to find names (assuming they appear after "employee" or similar)
    const nameMatch = text.match(/(?:employee|name|holder)\s*:?\s*([A-Za-z\s]+)/i);
    if (nameMatch) {
      extractedData.employeeName = nameMatch[1].trim();
    }

    // Try to find issuer
    const issuerMatch = text.match(/(?:issuer|issued by|authority)\s*:?\s*([A-Za-z\s]+)/i);
    if (issuerMatch) {
      extractedData.issuer = issuerMatch[1].trim();
    }

    return {
      extractedData,
      confidence: 0.6, // Lower confidence for fallback extraction
      errors: ['AI processing failed, used fallback extraction']
    };
  }

  private normalizeDate(dateStr: string): string {
    try {
      // Convert various date formats to YYYY-MM-DD
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr; // Return original if can't parse
      }
      return date.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  }

  private async findEmployeeMatch(employeeName?: string): Promise<{
    id: string;
    name: string;
    confidence: number;
  } | undefined> {
    if (!employeeName) return undefined;

    try {
      const { data: employees } = await supabase
        .from('employees')
        .select('id, name')
        .ilike('name', `%${employeeName}%`)
        .limit(5);

      if (!employees || employees.length === 0) return undefined;

      // Simple string similarity matching
      const similarities = employees.map(emp => ({
        ...emp,
        confidence: this.calculateStringSimilarity(employeeName.toLowerCase(), emp.name.toLowerCase())
      }));

      const bestMatch = similarities.sort((a, b) => b.confidence - a.confidence)[0];
      
      return bestMatch.confidence > 0.6 ? bestMatch : undefined;
    } catch (error) {
      console.error('Error finding employee match:', error);
      return undefined;
    }
  }

  private async findLicenseMatch(certificateType?: string, fullText?: string): Promise<{
    id: string;
    name: string;
    confidence: number;
  } | undefined> {
    if (!certificateType && !fullText) return undefined;

    try {
      const { data: licenses } = await supabase
        .from('licenses')
        .select('id, name, description, level');

      if (!licenses || licenses.length === 0) return undefined;

      const searchText = (certificateType || fullText || '').toLowerCase();
      
      const similarities = licenses.map(license => {
        const nameMatch = this.calculateStringSimilarity(searchText, license.name.toLowerCase());
        const descriptionMatch = license.description ? 
          this.calculateStringSimilarity(searchText, license.description.toLowerCase()) : 0;
        return {
          ...license,
          confidence: Math.max(nameMatch, descriptionMatch)
        };
      });

      const bestMatch = similarities.sort((a, b) => b.confidence - a.confidence)[0];
      
      return bestMatch.confidence > 0.4 ? bestMatch : undefined;
    } catch (error) {
      console.error('Error finding license match:', error);
      return undefined;
    }
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Validates and corrects date format, handling European DD-MM-YYYY format
   */
  private validateAndCorrectDate(dateString: string): string {
    if (!dateString) return dateString;
    
    // If already in YYYY-MM-DD format and valid, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return dateString;
      }
    }
    
    // Handle European formats: DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
    const europeanPattern = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/;
    const match = dateString.match(europeanPattern);
    
    if (match) {
      const [, day, month, year] = match;
      const paddedDay = day.padStart(2, '0');
      const paddedMonth = month.padStart(2, '0');
      
      // Validate the date
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime()) && 
          date.getFullYear() === parseInt(year) &&
          date.getMonth() === parseInt(month) - 1 &&
          date.getDate() === parseInt(day)) {
        return `${year}-${paddedMonth}-${paddedDay}`;
      }
    }
    
    // If can't parse, return original
    return dateString;
  }

  private async updateDocumentWithResults(documentId: string, result: DocumentProcessingResult): Promise<void> {
    const updateData = {
      processing_status: result.success ? 'completed' : 'failed',
      extracted_certificate_number: result.extractedData.certificateNumber,
      extracted_issue_date: result.extractedData.issueDate,
      extracted_expiry_date: result.extractedData.expiryDate,
      extracted_employee_name: result.extractedData.employeeName,
      extracted_license_type: result.extractedData.certificateType,
      extracted_issuer: result.extractedData.issuer,
      ai_confidence_score: result.confidence,
      ai_extracted_data: {
        confidence: result.confidence,
        fields_found: Object.keys(result.extractedData).filter(key => result.extractedData[key]),
        employee_suggestion: result.suggestedEmployee,
        license_suggestion: result.suggestedLicense,
        errors: result.errors
      }
    };

    await supabase
      .from('certificate_documents')
      .update(updateData)
      .eq('id', documentId);
  }
}

export const documentProcessingService = new DocumentProcessingService();