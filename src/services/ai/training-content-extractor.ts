import { OpenAIService } from "./openai-service";
import { AI_CONFIG } from '@/config/ai';

export interface TrainingContentInput {
  type: 'text' | 'image' | 'outlook' | 'file';
  content: string;
  fileName?: string;
  fileType?: string;
}

export interface ExtractedTrainingData {
  title?: string;
  description?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  location?: string;
  instructor?: string;
  maxParticipants?: number;
  course?: string;
  provider?: string;
  participants?: string[];
  costs?: {
    amount?: number;
    currency?: string;
    breakdown?: Array<{
      type: string;
      amount: number;
      description?: string;
    }>;
  };
  notes?: string;
  requirements?: string[];
  materials?: string[];
  meetingUrl?: string;
  confidence?: number;
}

export class TrainingContentExtractor {
  private openAIService: OpenAIService;

  constructor() {
    this.openAIService = new OpenAIService();
  }

  async extractTrainingContent(input: TrainingContentInput): Promise<ExtractedTrainingData> {
    const prompt = this.buildExtractionPrompt(input);
    
    try {
      let response;
      
      if (input.type === 'image') {
        // For images, use a direct OpenAI API call with vision capabilities
        response = await this.processImageWithVision(input.content, prompt);
      } else {
        // For text, use the regular OpenAI service
        response = await this.openAIService.processMessage({
          message: prompt,
          systemPrompt: `You are an expert training data extractor. Your task is to extract structured training information from various input types (text, Outlook items, files). 

CRITICAL: You MUST return ONLY valid JSON without any markdown formatting, explanations, or additional text. Do not include code blocks, backticks, or any other formatting.

IMPORTANT: Parse dates carefully and convert them to ISO format (YYYY-MM-DD). Parse times to 24-hour format (HH:MM).

Extract the following information when available:
- title: Training name/title
- description: Training description/agenda
- startDate: Training start date (YYYY-MM-DD format)
- startTime: Training start time (HH:MM format)
- endDate: Training end date (YYYY-MM-DD format)
- endTime: Training end time (HH:MM format)
- location: Training location (physical address or "Online")
- instructor: Instructor/trainer name
- maxParticipants: Maximum number of participants
- course: Course name/category
- provider: Training provider/company
- participants: List of participant names/emails
- costs: Cost information with breakdown
- notes: Additional notes/requirements
- requirements: Prerequisites or requirements
- materials: Required materials/equipment
- meetingUrl: Online meeting URL (Teams, Zoom, etc.)
- confidence: Your confidence level (0-100) in the extraction accuracy

If you cannot extract meaningful training information, return:
{"confidence": 10, "notes": "Unable to extract training information from provided content"}

Return ONLY the JSON object, no other text or formatting.`,
          conversationId: `training-extraction-${Date.now()}`
        });
      }

      // Clean the response content by removing markdown formatting and extra text
      let cleanResponse = response.content.trim();
      
      // Remove markdown code blocks if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```$/g, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/g, '').replace(/```$/g, '');
      }
      
      // Find the JSON object in the response
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }

      const extractedData = JSON.parse(cleanResponse) as ExtractedTrainingData;
      
      // Validate and sanitize the extracted data
      return this.validateAndSanitize(extractedData);
    } catch (error) {
      console.error('Error extracting training content:', error);
      
      // Return a fallback response instead of throwing an error
      const fallbackData: ExtractedTrainingData = {
        confidence: 10,
        notes: `Unable to extract training information from provided content. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      
      return this.validateAndSanitize(fallbackData);
    }
  }

  private async processImageWithVision(imageContent: string, prompt: string): Promise<{content: string}> {
    if (!AI_CONFIG.openai.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch(`${AI_CONFIG.openai.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.openai.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o', // Use GPT-4 Vision model
          messages: [
            {
              role: 'system',
              content: `You are an expert training data extractor. Your task is to extract structured training information from images.

CRITICAL: You MUST return ONLY valid JSON without any markdown formatting, explanations, or additional text. Do not include code blocks, backticks, or any other formatting.

IMPORTANT: Parse dates carefully and convert them to ISO format (YYYY-MM-DD). Parse times to 24-hour format (HH:MM).

Extract the following information when available:
- title: Training name/title
- description: Training description/agenda
- startDate: Training start date (YYYY-MM-DD format)
- startTime: Training start time (HH:MM format)
- endDate: Training end date (YYYY-MM-DD format)
- endTime: Training end time (HH:MM format)
- location: Training location (physical address or "Online")
- instructor: Instructor/trainer name
- maxParticipants: Maximum number of participants
- course: Course name/category
- provider: Training provider/company
- participants: List of participant names/emails
- costs: Cost information with breakdown
- notes: Additional notes/requirements
- requirements: Prerequisites or requirements
- materials: Required materials/equipment
- meetingUrl: Online meeting URL (Teams, Zoom, etc.)
- confidence: Your confidence level (0-100) in the extraction accuracy

If you cannot extract meaningful training information, return:
{"confidence": 10, "notes": "Unable to extract training information from provided content"}

Return ONLY the JSON object, no other text or formatting.`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageContent
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI Vision API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenAI Vision');
      }

      return {
        content: data.choices[0].message.content
      };

    } catch (error) {
      console.error('Vision API Error:', error);
      throw error;
    }
  }

  private buildExtractionPrompt(input: TrainingContentInput): string {
    let prompt = '';

    switch (input.type) {
      case 'text':
        prompt = `Extract training information from this text content:\n\n${input.content}`;
        break;
      
      case 'image':
        prompt = `Extract training information from this image. The image may contain:
- Training invitations or announcements
- Calendar screenshots with training sessions
- Course schedules or timetables
- Meeting invitations for training sessions
- Training certificates with course information
- Workshop or seminar flyers

Analyze the image carefully and extract any training-related information such as:
- Training titles, course names, or session titles
- Dates and times
- Locations (physical addresses or online meeting details)
- Instructor names
- Training provider or organization
- Contact information
- Cost information
- Prerequisites or requirements

If the image contains text, read it carefully and extract structured training information.

Image data: ${input.content}`;
        break;
      
      case 'outlook':
        prompt = `Extract training information from this Outlook calendar item or email:

${input.content}

This may include:
- Meeting invitations
- Training announcements
- Course schedules
- Calendar entries
- Email confirmations`;
        break;
      
      case 'file':
        prompt = `Extract training information from this file content:
File name: ${input.fileName || 'Unknown'}
File type: ${input.fileType || 'Unknown'}

Content:
${input.content}`;
        break;
    }

    return prompt;
  }

  private validateAndSanitize(data: ExtractedTrainingData): ExtractedTrainingData {
    const sanitized: ExtractedTrainingData = {
      confidence: data.confidence || 50
    };

    // Sanitize and validate each field
    if (data.title && typeof data.title === 'string') {
      sanitized.title = data.title.trim();
    }

    if (data.description && typeof data.description === 'string') {
      sanitized.description = data.description.trim();
    }

    // Validate dates
    if (data.startDate && this.isValidDate(data.startDate)) {
      sanitized.startDate = data.startDate;
    }

    if (data.endDate && this.isValidDate(data.endDate)) {
      sanitized.endDate = data.endDate;
    }

    // Validate times
    if (data.startTime && this.isValidTime(data.startTime)) {
      sanitized.startTime = data.startTime;
    }

    if (data.endTime && this.isValidTime(data.endTime)) {
      sanitized.endTime = data.endTime;
    }

    if (data.location && typeof data.location === 'string') {
      sanitized.location = data.location.trim();
    }

    if (data.instructor && typeof data.instructor === 'string') {
      sanitized.instructor = data.instructor.trim();
    }

    if (data.maxParticipants && typeof data.maxParticipants === 'number' && data.maxParticipants > 0) {
      sanitized.maxParticipants = Math.floor(data.maxParticipants);
    }

    if (data.course && typeof data.course === 'string') {
      sanitized.course = data.course.trim();
    }

    if (data.provider && typeof data.provider === 'string') {
      sanitized.provider = data.provider.trim();
    }

    if (data.participants && Array.isArray(data.participants)) {
      sanitized.participants = data.participants
        .filter(p => typeof p === 'string')
        .map(p => p.trim())
        .filter(p => p.length > 0);
    }

    if (data.costs && typeof data.costs === 'object') {
      sanitized.costs = {
        amount: typeof data.costs.amount === 'number' ? data.costs.amount : undefined,
        currency: typeof data.costs.currency === 'string' ? data.costs.currency : 'EUR',
        breakdown: Array.isArray(data.costs.breakdown) ? data.costs.breakdown : undefined
      };
    }

    if (data.notes && typeof data.notes === 'string') {
      sanitized.notes = data.notes.trim();
    }

    if (data.requirements && Array.isArray(data.requirements)) {
      sanitized.requirements = data.requirements
        .filter(r => typeof r === 'string')
        .map(r => r.trim())
        .filter(r => r.length > 0);
    }

    if (data.materials && Array.isArray(data.materials)) {
      sanitized.materials = data.materials
        .filter(m => typeof m === 'string')
        .map(m => m.trim())
        .filter(m => m.length > 0);
    }

    if (data.meetingUrl && typeof data.meetingUrl === 'string' && this.isValidUrl(data.meetingUrl)) {
      sanitized.meetingUrl = data.meetingUrl.trim();
    }

    return sanitized;
  }

  private isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  }

  private isValidTime(timeStr: string): boolean {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr);
  }

  private isValidUrl(urlStr: string): boolean {
    try {
      new URL(urlStr);
      return true;
    } catch {
      return false;
    }
  }

  // Method to convert common date formats to ISO format
  static formatDateForInput(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      
      // Return in YYYY-MM-DD format for HTML date input
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  // Method to combine date and time for datetime-local input
  static formatDateTimeForInput(dateStr: string, timeStr: string): string {
    try {
      const date = TrainingContentExtractor.formatDateForInput(dateStr);
      if (!date || !timeStr) return '';
      
      return `${date}T${timeStr}`;
    } catch {
      return '';
    }
  }
}