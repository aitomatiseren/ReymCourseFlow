import { toast } from 'sonner';

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  model: string;
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

export interface TextToSpeechRequest {
  text: string;
  voice_settings?: VoiceSettings;
  model_id?: string;
}

export interface Voice {
  voice_id: string;
  name: string;
  samples: Array<{
    sample_id: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    hash: string;
  }>;
  category: string;
  fine_tuning: {
    model_id: string;
    is_allowed_to_fine_tune: boolean;
    state: Record<string, any>;
    verification_failures: string[];
    verification_attempts_count: number;
    manual_verification_requested: boolean;
  };
  labels: Record<string, string>;
  description: string;
  preview_url: string;
  available_for_tiers: string[];
  settings: VoiceSettings;
  sharing: {
    status: string;
    history_item_sample_id: string;
    original_voice_id: string;
    public_owner_id: string;
    liked_by_count: number;
    cloned_by_count: number;
  };
  high_quality_base_model_ids: string[];
}

export class ElevenLabsService {
  private static instance: ElevenLabsService;
  private config: ElevenLabsConfig;
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  private constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
      voiceId: import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB', // Default voice
      model: 'eleven_multilingual_v2',
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.0,
      useSpeakerBoost: true,
    };
  }

  public static getInstance(): ElevenLabsService {
    if (!ElevenLabsService.instance) {
      ElevenLabsService.instance = new ElevenLabsService();
    }
    return ElevenLabsService.instance;
  }

  public isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  public updateConfig(config: Partial<ElevenLabsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public async getVoices(): Promise<Voice[]> {
    if (!this.isConfigured()) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  public async textToSpeech(text: string, voiceId?: string): Promise<Blob> {
    if (!this.isConfigured()) {
      throw new Error('ElevenLabs API key not configured');
    }

    const selectedVoiceId = voiceId || this.config.voiceId;
    
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: this.config.model,
          voice_settings: {
            stability: this.config.stability,
            similarity_boost: this.config.similarityBoost,
            style: this.config.style,
            use_speaker_boost: this.config.useSpeakerBoost,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  }

  public async playText(text: string, voiceId?: string): Promise<void> {
    try {
      // Stop any currently playing audio
      this.stopAudio();

      // Generate audio
      const audioBlob = await this.textToSpeech(text, voiceId);
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play audio
      this.currentAudio = new Audio(audioUrl);
      
      return new Promise((resolve, reject) => {
        if (!this.currentAudio) {
          reject(new Error('Audio not initialized'));
          return;
        }

        this.currentAudio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          resolve();
        };

        this.currentAudio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          reject(error);
        };

        this.currentAudio.play().catch(reject);
      });
    } catch (error) {
      console.error('Error playing text:', error);
      throw error;
    }
  }

  public stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  public isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }

  // Speech-to-text functionality for voice input
  public async startSpeechRecognition(): Promise<string> {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported in this browser');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    return new Promise((resolve, reject) => {
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      recognition.onend = () => {
        // Recognition ended
      };

      recognition.start();
    });
  }

  // Enhanced conversation flow with voice
  public async handleVoiceConversation(
    onUserSpeech: (text: string) => void,
    onAIResponse: (text: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      // Start listening for user speech
      toast.info('Listening... Speak now');
      const userSpeech = await this.startSpeechRecognition();
      
      if (!userSpeech.trim()) {
        throw new Error('No speech detected');
      }

      // Process user speech
      onUserSpeech(userSpeech);

      // Note: AI response generation should be handled by the calling component
      // This service only handles the voice input/output
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Voice conversation failed';
      onError(errorMessage);
      toast.error(errorMessage);
    }
  }

  // Voice commands for training scheduling
  public parseVoiceCommand(transcript: string): {
    action: string;
    parameters: Record<string, any>;
  } {
    const lowerTranscript = transcript.toLowerCase();
    
    // Training scheduling commands
    if (lowerTranscript.includes('schedule') && lowerTranscript.includes('training')) {
      return {
        action: 'schedule_training',
        parameters: {
          transcript,
          extractedInfo: this.extractSchedulingInfo(transcript)
        }
      };
    }
    
    if (lowerTranscript.includes('find') && lowerTranscript.includes('employee')) {
      return {
        action: 'find_employee',
        parameters: {
          transcript,
          searchQuery: this.extractSearchQuery(transcript)
        }
      };
    }
    
    if (lowerTranscript.includes('check') && lowerTranscript.includes('availability')) {
      return {
        action: 'check_availability',
        parameters: {
          transcript,
          employeeName: this.extractEmployeeName(transcript)
        }
      };
    }
    
    if (lowerTranscript.includes('show') && lowerTranscript.includes('certificate')) {
      return {
        action: 'show_certificates',
        parameters: {
          transcript,
          employeeName: this.extractEmployeeName(transcript)
        }
      };
    }
    
    // Default chat action
    return {
      action: 'chat',
      parameters: {
        transcript,
        message: transcript
      }
    };
  }

  private extractSchedulingInfo(transcript: string): Record<string, any> {
    const info: Record<string, any> = {};
    
    // Extract course names (common training types)
    const coursePatterns = [
      /\b(vca|bhv|code 95|forklift|crane|safety)\b/gi,
      /\b(\w+)\s+training\b/gi,
      /\b(\w+)\s+course\b/gi,
    ];
    
    coursePatterns.forEach(pattern => {
      const matches = transcript.match(pattern);
      if (matches) {
        info.courseName = matches[0];
      }
    });
    
    // Extract dates
    const datePatterns = [
      /\b(next week|this week|tomorrow|today)\b/gi,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/gi,
    ];
    
    datePatterns.forEach(pattern => {
      const matches = transcript.match(pattern);
      if (matches) {
        info.date = matches[0];
      }
    });
    
    // Extract employee names or counts
    const employeePatterns = [
      /\b(\d+)\s+people\b/gi,
      /\b(\d+)\s+employees\b/gi,
      /\bfor\s+(\w+\s+\w+)\b/gi,
    ];
    
    employeePatterns.forEach(pattern => {
      const matches = transcript.match(pattern);
      if (matches) {
        info.employees = matches[0];
      }
    });
    
    return info;
  }

  private extractSearchQuery(transcript: string): string {
    const patterns = [
      /find\s+employee\s+(\w+(?:\s+\w+)*)/gi,
      /find\s+(\w+(?:\s+\w+)*)/gi,
      /search\s+for\s+(\w+(?:\s+\w+)*)/gi,
    ];
    
    for (const pattern of patterns) {
      const match = transcript.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return transcript;
  }

  private extractEmployeeName(transcript: string): string {
    const patterns = [
      /for\s+(\w+\s+\w+)/gi,
      /employee\s+(\w+\s+\w+)/gi,
      /(\w+\s+\w+)(?:\s+availability|\s+certificate)/gi,
    ];
    
    for (const pattern of patterns) {
      const match = transcript.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return '';
  }
}

// Global speech recognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}