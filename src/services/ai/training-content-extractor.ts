import { OpenAIService } from "./openai-service";
import { AI_CONFIG } from '@/config/ai';

export interface TrainingContentInput {
  type: 'text' | 'image' | 'outlook' | 'file';
  content: string;
  fileName?: string;
  fileType?: string;
}

export interface TrainingSession {
  date?: string;
  startTime?: string;
  endTime?: string;
  title?: string;
  location?: string;
  instructor?: string;
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
  sessions?: TrainingSession[];
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
        // For text, use rate-limited API call with retry logic for 429 errors
        response = await this.processTextWithRetry(prompt);
      }

      // Clean the response content by removing markdown formatting and extra text
      let cleanResponse = response.content.trim();
      
      // Remove markdown code blocks if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```$/g, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/g, '').replace(/```$/g, '');
      }
      
      // More robust JSON extraction - look for JSON object patterns
      let jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      
      // If no JSON found, try to extract from mixed text/JSON responses
      if (!jsonMatch) {
        // Look for JSON objects that might be embedded in text
        const jsonPatterns = [
          /(?:```json)?\s*(\{[\s\S]*?\})\s*(?:```)?/,
          /(?:here is|here's|the json|json object|response):\s*(\{[\s\S]*?\})/i,
          /(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/
        ];
        
        for (const pattern of jsonPatterns) {
          const match = cleanResponse.match(pattern);
          if (match) {
            jsonMatch = [match[1] || match[0]];
            break;
          }
        }
      }
      
      if (jsonMatch) {
        cleanResponse = jsonMatch[0].trim();
      } else {
        // If still no JSON found, try to extract structured data from the AI text response
        console.warn('No valid JSON found in AI response, creating structured fallback:', cleanResponse);
        
        // Try to parse training data from the text response
        const extractedStructuredData = this.parseStructuredDataFromText(cleanResponse);
        
        cleanResponse = JSON.stringify(extractedStructuredData);
      }

      let extractedData: ExtractedTrainingData;
      
      try {
        extractedData = JSON.parse(cleanResponse) as ExtractedTrainingData;
      } catch (parseError) {
        // If JSON parsing fails, log the problematic response and try to fix common issues
        console.error('JSON parsing failed for AI response:', {
          originalResponse: response.content,
          cleanedResponse: cleanResponse,
          parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
        });
        
        // Try to fix common JSON issues
        let fixedResponse = cleanResponse;
        
        // Fix incomplete JSON by adding missing closing brackets
        const openBraces = (fixedResponse.match(/\{/g) || []).length;
        const closeBraces = (fixedResponse.match(/\}/g) || []).length;
        if (openBraces > closeBraces) {
          fixedResponse += '}'.repeat(openBraces - closeBraces);
        }
        
        // Fix incomplete arrays by adding missing closing brackets
        const openArrays = (fixedResponse.match(/\[/g) || []).length;
        const closeArrays = (fixedResponse.match(/\]/g) || []).length;
        if (openArrays > closeArrays) {
          fixedResponse += ']'.repeat(openArrays - closeArrays);
        }
        
        // Try parsing the fixed response
        try {
          extractedData = JSON.parse(fixedResponse) as ExtractedTrainingData;
          console.log('Successfully parsed fixed JSON response');
        } catch (secondParseError) {
          console.warn('Could not fix JSON, using text parser fallback');
          // If still fails, try to parse structured data from the AI text response
          const extractedStructuredData = this.parseStructuredDataFromText(response.content);
          extractedData = extractedStructuredData;
        }
      }
      
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

  private async processTextWithRetry(prompt: string): Promise<{content: string}> {
    if (!AI_CONFIG.openai.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `Extract training information as JSON. Return ONLY valid JSON, no explanations.

REQUIRED FORMAT - Return this structure:
{
  "title": "Training name",
  "startDate": "DD-MM-YYYY", 
  "startTime": "HH:MM",
  "endDate": "DD-MM-YYYY",
  "endTime": "HH:MM", 
  "location": "Location",
  "instructor": "Instructor name",
  "course": "Course code/name",
  "sessions": [{"date": "DD-MM-YYYY", "startTime": "HH:MM", "endTime": "HH:MM", "title": "Session name"}],
  "confidence": 75
}

EXTRACTION RULES:
• Find ALL training sessions and dates
• Keep Dutch dates as DD-MM-YYYY (e.g. "19-06-2025")  
• Use 24-hour time format (e.g. "08:00")
• Extract course codes like "RVM1-C", "ADR", "Rijbewijs C"
• Include all sessions in sessions array
• Set confidence 10-100 based on data quality

Return ONLY the JSON object.`;

    const maxRetries = 5; // Increased retries for more persistence
    let retryDelay = 3000; // Start with 3 seconds (more conservative)

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${AI_CONFIG.openai.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_CONFIG.openai.apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            max_tokens: 2000, // Increased to prevent JSON truncation
            temperature: 0.1
          })
        });

        if (response.status === 429) {
          // Rate limited - wait and retry with longer delays
          if (attempt < maxRetries) {
            console.warn(`OpenAI Rate limited (429), retrying in ${retryDelay}ms... (attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryDelay = Math.min(retryDelay * 2, 30000); // Exponential backoff, capped at 30 seconds
            continue;
          } else {
            throw new Error(`OpenAI rate limit exceeded after ${maxRetries} retries. Your API key may have very low rate limits. Consider upgrading your OpenAI plan or waiting longer between requests.`);
          }
        }

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.choices || data.choices.length === 0) {
          throw new Error('No response from OpenAI');
        }

        return {
          content: data.choices[0].message.content
        };

      } catch (error) {
        if (attempt === maxRetries) {
          console.error('All retry attempts failed:', error);
          throw error;
        }
        
        // For non-429 errors, still retry with delay
        console.warn(`API call failed (attempt ${attempt}/${maxRetries}):`, error);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay = Math.min(retryDelay * 2, 30000); // Exponential backoff, capped at 30 seconds
      }
    }

    throw new Error('Max retries exceeded');
  }

  private async processImageWithVision(imageContent: string, prompt: string): Promise<{content: string}> {
    if (!AI_CONFIG.openai.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `Extract training information from image as JSON. Return ONLY valid JSON, no explanations.

REQUIRED FORMAT:
{
  "title": "Training name",
  "startDate": "DD-MM-YYYY", 
  "startTime": "HH:MM",
  "endDate": "DD-MM-YYYY",
  "endTime": "HH:MM", 
  "location": "Location",
  "instructor": "Instructor name",
  "course": "Course code/name",
  "sessions": [{"date": "DD-MM-YYYY", "startTime": "HH:MM", "endTime": "HH:MM", "title": "Session name"}],
  "confidence": 75
}

RULES:
• Read ALL text in the image carefully
• Find ALL training sessions and dates
• Keep Dutch dates as DD-MM-YYYY format  
• Use 24-hour time (e.g. "08:00")
• Extract course codes like "RVM1-C", "ADR", "Rijbewijs C"
• Include all sessions in sessions array
• Set confidence 10-100 based on clarity

Return ONLY JSON.`;

    const maxRetries = 5; // Increased retries for more persistence
    let retryDelay = 3000; // Start with 3 seconds (more conservative)

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
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
              { role: 'system', content: systemPrompt },
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
            max_tokens: 2000, // Increased to prevent JSON truncation
            temperature: 0.1
          })
        });

        if (response.status === 429) {
          // Rate limited - wait and retry with longer delays
          if (attempt < maxRetries) {
            console.warn(`Vision API rate limited (429), retrying in ${retryDelay}ms... (attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryDelay = Math.min(retryDelay * 2, 30000); // Exponential backoff, capped at 30 seconds
            continue;
          } else {
            throw new Error(`Vision API rate limit exceeded after ${maxRetries} retries. Your OpenAI API key may have very low rate limits. Consider upgrading your OpenAI plan.`);
          }
        }

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
        if (attempt === maxRetries) {
          console.error('All vision API retry attempts failed:', error);
          throw error;
        }
        
        // For non-429 errors, still retry with delay
        console.warn(`Vision API call failed (attempt ${attempt}/${maxRetries}):`, error);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay = Math.min(retryDelay * 2, 30000); // Exponential backoff, capped at 30 seconds
      }
    }

    throw new Error('Max retries exceeded for vision API');
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

  private parseStructuredDataFromText(text: string): ExtractedTrainingData {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const data: ExtractedTrainingData = {
      confidence: 10,
      notes: text,
      sessions: []
    };

    let currentSession: Partial<TrainingSession> = {};
    let foundSessions = false;

    for (const line of lines) {
      // Try to extract course title/name
      if (line.includes('**') && (line.includes('module') || line.includes('Module') || line.includes('Rijbewijs') || line.includes('Vakbekwaamheid'))) {
        const titleMatch = line.match(/\*\*(.*?)\*\*/);
        if (titleMatch) {
          const title = titleMatch[1].trim();
          if (!data.title && !foundSessions) {
            data.title = title;
            data.course = title;
          }
          // Start new session
          if (currentSession.date || currentSession.startTime) {
            data.sessions?.push({ ...currentSession });
          }
          currentSession = { title };
          foundSessions = true;
        }
      }

      // Extract date information
      const dateMatch = line.match(/\*\*Date:\*\*\s*(.+)/i) || line.match(/\*\*Date:\*\*\s*(.+)/);
      if (dateMatch) {
        const dateStr = dateMatch[1].trim();
        // Convert dates from format like "Thursday, 19-06-2025" to "19-06-2025"
        const dateOnlyMatch = dateStr.match(/(\d{2}-\d{2}-\d{4})/);
        if (dateOnlyMatch) {
          const date = dateOnlyMatch[1];
          if (foundSessions) {
            currentSession.date = date;
          } else {
            data.startDate = date;
          }
        }
      }

      // Extract time information
      const timeMatch = line.match(/\*\*Time:\*\*\s*(.+)/i);
      if (timeMatch) {
        const timeStr = timeMatch[1].trim();
        // Parse time ranges like "08:00 - 12:00" or "08:00 - 16:00"
        const timeRangeMatch = timeStr.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
        if (timeRangeMatch) {
          const startTime = timeRangeMatch[1];
          const endTime = timeRangeMatch[2];
          if (foundSessions) {
            currentSession.startTime = startTime;
            currentSession.endTime = endTime;
          } else {
            data.startTime = startTime;
            data.endTime = endTime;
          }
        }
      }

      // Extract instructor information
      const instructorMatch = line.match(/\*\*Instructor:\*\*\s*(.+)/i);
      if (instructorMatch) {
        const instructor = instructorMatch[1].trim();
        if (foundSessions) {
          currentSession.instructor = instructor;
        } else {
          data.instructor = instructor;
        }
      }

      // Extract location information
      const locationMatch = line.match(/\*\*Location:\*\*\s*(.+)/i);
      if (locationMatch) {
        const location = locationMatch[1].trim();
        if (foundSessions) {
          currentSession.location = location;
        } else {
          data.location = location;
        }
      }
    }

    // Add the last session if it has data
    if (currentSession.date || currentSession.startTime || currentSession.title) {
      data.sessions?.push({ ...currentSession });
    }

    // If we found sessions, set higher confidence and merge same-day sessions
    if (data.sessions && data.sessions.length > 0) {
      data.confidence = 75;
      
      // Group sessions by date and merge same-day sessions
      const sessionsByDate = new Map<string, TrainingSession[]>();
      
      data.sessions.forEach(session => {
        if (session.date) {
          if (!sessionsByDate.has(session.date)) {
            sessionsByDate.set(session.date, []);
          }
          sessionsByDate.get(session.date)!.push(session);
        }
      });
      
      // Merge sessions for each date
      const mergedSessions: TrainingSession[] = [];
      sessionsByDate.forEach((sessions, date) => {
        if (sessions.length === 1) {
          // Single session - keep as is but add note if it has title
          const session = sessions[0];
          if (session.title && session.title !== data.title) {
            mergedSessions.push({
              ...session,
              title: `${session.title}` // Keep original title as the session note
            });
          } else {
            mergedSessions.push(session);
          }
        } else {
          // Multiple sessions on same day - merge them
          const sortedSessions = sessions.sort((a, b) => {
            if (!a.startTime || !b.startTime) return 0;
            return a.startTime.localeCompare(b.startTime);
          });
          
          const firstSession = sortedSessions[0];
          const lastSession = sortedSessions[sortedSessions.length - 1];
          
          // Create merged session with earliest start and latest end time
          const mergedSession: TrainingSession = {
            date: date,
            startTime: firstSession.startTime,
            endTime: lastSession.endTime,
            location: firstSession.location || lastSession.location,
            instructor: firstSession.instructor || lastSession.instructor,
            title: this.createSessionNote(sortedSessions, data.title)
          };
          
          mergedSessions.push(mergedSession);
        }
      });
      
      // Sort merged sessions by date
      data.sessions = mergedSessions.sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return a.date.localeCompare(b.date);
      });
      
      // Use first session for main training data if not already set
      const firstSession = data.sessions[0];
      if (!data.startDate && firstSession.date) {
        data.startDate = firstSession.date;
      }
      if (!data.startTime && firstSession.startTime) {
        data.startTime = firstSession.startTime;
      }
      if (!data.endTime && firstSession.endTime) {
        data.endTime = firstSession.endTime;
      }
      if (!data.instructor && firstSession.instructor) {
        data.instructor = firstSession.instructor;
      }
      if (!data.location && firstSession.location) {
        data.location = firstSession.location;
      }
      
      // Find last session for overall end date
      const lastSession = data.sessions[data.sessions.length - 1];
      if (lastSession.date && lastSession.date !== data.startDate) {
        data.endDate = lastSession.date;
      }
    }

    return data;
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

    if (data.sessions && Array.isArray(data.sessions)) {
      sanitized.sessions = data.sessions
        .filter(s => typeof s === 'object' && s !== null)
        .map(session => ({
          date: session.date && this.isValidDate(session.date) ? session.date : undefined,
          startTime: session.startTime && this.isValidTime(session.startTime) ? session.startTime : undefined,
          endTime: session.endTime && this.isValidTime(session.endTime) ? session.endTime : undefined,
          title: typeof session.title === 'string' ? session.title.trim() : undefined,
          location: typeof session.location === 'string' ? session.location.trim() : undefined,
          instructor: typeof session.instructor === 'string' ? session.instructor.trim() : undefined,
        }))
        .filter(session => session.date || session.startTime || session.title); // Keep sessions with at least some data
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
    // Accept both DD-MM-YYYY and YYYY-MM-DD formats
    const ddmmyyyyPattern = /^\d{2}-\d{2}-\d{4}$/;
    const yyyymmddPattern = /^\d{4}-\d{2}-\d{2}$/;
    
    if (ddmmyyyyPattern.test(dateStr)) {
      // DD-MM-YYYY format - parse manually
      const [day, month, year] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    } else if (yyyymmddPattern.test(dateStr)) {
      // YYYY-MM-DD format - use standard parsing
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    }
    
    // Try general date parsing as fallback
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
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