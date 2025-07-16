import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  Loader2,
  MessageSquare,
  Users,
  Calendar,
  FileText,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { ElevenLabsService } from '@/services/ai/elevenlabs-service';
import { AIService } from '@/services/ai';
import { toast } from 'sonner';
import { useAIChat } from '@/hooks/useAIChat';

interface VoiceChatProps {
  onVoiceCommand?: (command: string, parameters: Record<string, any>) => void;
  onNavigate?: (path: string) => void;
  className?: string;
}

export function VoiceChat({ 
  onVoiceCommand, 
  onNavigate, 
  className = '' 
}: VoiceChatProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isVoice?: boolean;
  }>>([]);

  const elevenlabsService = useRef(ElevenLabsService.getInstance());
  const aiService = useRef(AIService.getInstance());
  const { sendMessage } = useAIChat();

  useEffect(() => {
    return () => {
      // Cleanup: stop any playing audio
      elevenlabsService.current.stopAudio();
    };
  }, []);

  const handleStartListening = async () => {
    if (!elevenlabsService.current.isConfigured()) {
      toast.error('ElevenLabs not configured. Please check your API key.');
      return;
    }

    setIsListening(true);
    setCurrentTranscript('');
    
    try {
      await elevenlabsService.current.handleVoiceConversation(
        (userSpeech) => {
          setCurrentTranscript(userSpeech);
          handleUserSpeech(userSpeech);
        },
        (aiResponse) => {
          handleAIResponse(aiResponse);
        },
        (error) => {
          console.error('Voice conversation error:', error);
          setIsListening(false);
        }
      );
    } catch (error) {
      console.error('Failed to start voice conversation:', error);
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    setIsListening(false);
    setCurrentTranscript('');
  };

  const handleUserSpeech = async (transcript: string) => {
    setIsListening(false);
    setIsProcessing(true);
    
    // Add user message to history
    const userMessage = {
      role: 'user' as const,
      content: transcript,
      timestamp: new Date(),
      isVoice: true
    };
    
    setConversationHistory(prev => [...prev, userMessage]);
    
    try {
      // Parse voice command
      const command = elevenlabsService.current.parseVoiceCommand(transcript);
      setLastCommand(command.action);
      
      // Handle different command types
      switch (command.action) {
        case 'schedule_training':
          await handleScheduleTrainingCommand(command.parameters);
          break;
        case 'find_employee':
          await handleFindEmployeeCommand(command.parameters);
          break;
        case 'check_availability':
          await handleCheckAvailabilityCommand(command.parameters);
          break;
        case 'show_certificates':
          await handleShowCertificatesCommand(command.parameters);
          break;
        case 'chat':
        default:
          await handleChatCommand(command.parameters);
          break;
      }
      
      // Execute custom voice command handler if provided
      if (onVoiceCommand) {
        onVoiceCommand(command.action, command.parameters);
      }
      
    } catch (error) {
      console.error('Error processing user speech:', error);
      const errorMessage = 'Sorry, I had trouble understanding that. Could you please try again?';
      await handleAIResponse(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScheduleTrainingCommand = async (parameters: Record<string, any>) => {
    const extractedInfo = parameters.extractedInfo || {};
    let response = 'I can help you schedule training. ';
    
    if (extractedInfo.courseName) {
      response += `I understand you want to schedule ${extractedInfo.courseName}. `;
    }
    
    if (extractedInfo.date) {
      response += `For ${extractedInfo.date}. `;
    }
    
    if (extractedInfo.employees) {
      response += `For ${extractedInfo.employees}. `;
    }
    
    response += 'Let me take you to the training scheduler where you can set up the details.';
    
    // Navigate to training scheduler
    if (onNavigate) {
      onNavigate('/scheduling');
    }
    
    await handleAIResponse(response);
  };

  const handleFindEmployeeCommand = async (parameters: Record<string, any>) => {
    const searchQuery = parameters.searchQuery || '';
    const response = `I'll help you find employee ${searchQuery}. Let me search the employee database for you.`;
    
    // Navigate to participants page
    if (onNavigate) {
      onNavigate('/participants');
    }
    
    await handleAIResponse(response);
  };

  const handleCheckAvailabilityCommand = async (parameters: Record<string, any>) => {
    const employeeName = parameters.employeeName || '';
    const response = employeeName 
      ? `I'll check the availability for ${employeeName}. Let me look up their schedule.`
      : 'I can help you check employee availability. Let me take you to the employee overview.';
    
    // Navigate to participants page
    if (onNavigate) {
      onNavigate('/participants');
    }
    
    await handleAIResponse(response);
  };

  const handleShowCertificatesCommand = async (parameters: Record<string, any>) => {
    const employeeName = parameters.employeeName || '';
    const response = employeeName 
      ? `I'll show you the certificates for ${employeeName}.`
      : 'I can show you certificate information. Let me take you to the certifications page.';
    
    // Navigate to certifications page
    if (onNavigate) {
      onNavigate('/certifications');
    }
    
    await handleAIResponse(response);
  };

  const handleChatCommand = async (parameters: Record<string, any>) => {
    const message = parameters.message || '';
    
    try {
      // Send message to AI service
      const response = await sendMessage(message);
      await handleAIResponse(response);
    } catch (error) {
      console.error('Error sending message to AI:', error);
      await handleAIResponse('I apologize, but I encountered an error processing your request. Please try again.');
    }
  };

  const handleAIResponse = async (responseText: string) => {
    // Add AI response to history
    const aiMessage = {
      role: 'assistant' as const,
      content: responseText,
      timestamp: new Date(),
      isVoice: true
    };
    
    setConversationHistory(prev => [...prev, aiMessage]);
    
    // Play AI response if voice is enabled
    if (voiceEnabled && elevenlabsService.current.isConfigured()) {
      try {
        setIsPlaying(true);
        await elevenlabsService.current.playText(responseText);
      } catch (error) {
        console.error('Error playing AI response:', error);
      } finally {
        setIsPlaying(false);
      }
    }
  };

  const handleToggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isPlaying) {
      elevenlabsService.current.stopAudio();
      setIsPlaying(false);
    }
  };

  const handleStopAudio = () => {
    elevenlabsService.current.stopAudio();
    setIsPlaying(false);
  };

  const handleReplayLast = () => {
    const lastAIMessage = conversationHistory
      .slice()
      .reverse()
      .find(msg => msg.role === 'assistant');
    
    if (lastAIMessage && voiceEnabled) {
      elevenlabsService.current.playText(lastAIMessage.content);
    }
  };

  const getCommandIcon = (command: string) => {
    switch (command) {
      case 'schedule_training': return <Calendar className="h-4 w-4" />;
      case 'find_employee': return <Users className="h-4 w-4" />;
      case 'check_availability': return <Calendar className="h-4 w-4" />;
      case 'show_certificates': return <FileText className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getCommandLabel = (command: string) => {
    switch (command) {
      case 'schedule_training': return 'Schedule Training';
      case 'find_employee': return 'Find Employee';
      case 'check_availability': return 'Check Availability';
      case 'show_certificates': return 'Show Certificates';
      default: return 'Chat';
    }
  };

  const isElevenLabsConfigured = elevenlabsService.current.isConfigured();

  return (
    <Card className={`${className} border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-purple-600" />
          Voice Assistant
          {!isElevenLabsConfigured && (
            <Badge variant="destructive" className="text-xs">
              Not Configured
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Controls */}
        <div className="flex items-center gap-2 justify-center">
          <Button
            variant={isListening ? "destructive" : "default"}
            size="lg"
            onClick={isListening ? handleStopListening : handleStartListening}
            disabled={!isElevenLabsConfigured || isProcessing}
            className="flex-1"
          >
            {isListening ? (
              <>
                <MicOff className="h-5 w-5 mr-2" />
                Stop Listening
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 mr-2" />
                Start Voice Chat
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={handleToggleVoice}
            className={voiceEnabled ? "text-purple-600" : "text-gray-400"}
          >
            {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </div>

        {/* Current Status */}
        {(isListening || isProcessing || isPlaying) && (
          <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-lg">
            {isListening && (
              <>
                <Mic className="h-4 w-4 text-blue-600 animate-pulse" />
                <span className="text-sm text-blue-700">Listening...</span>
              </>
            )}
            {isProcessing && (
              <>
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                <span className="text-sm text-blue-700">Processing...</span>
              </>
            )}
            {isPlaying && (
              <>
                <Volume2 className="h-4 w-4 text-purple-600 animate-pulse" />
                <span className="text-sm text-purple-700">Speaking...</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStopAudio}
                  className="ml-2"
                >
                  <Pause className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* Current Transcript */}
        {currentTranscript && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>You said:</strong> "{currentTranscript}"
            </p>
          </div>
        )}

        {/* Last Command */}
        {lastCommand && (
          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
            {getCommandIcon(lastCommand)}
            <span className="text-sm text-purple-700">
              Command: {getCommandLabel(lastCommand)}
            </span>
          </div>
        )}

        {/* Voice Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReplayLast}
            disabled={!conversationHistory.some(msg => msg.role === 'assistant') || !voiceEnabled}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Replay Last
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConversationHistory([])}
            disabled={conversationHistory.length === 0}
            className="flex-1"
          >
            Clear History
          </Button>
        </div>

        {/* Quick Commands */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Quick Voice Commands:</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>"Schedule VCA training"</div>
            <div>"Find employee John Doe"</div>
            <div>"Check availability for..."</div>
            <div>"Show certificates for..."</div>
          </div>
        </div>

        {/* Configuration Help */}
        {!isElevenLabsConfigured && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Configuration Required:</strong> Add your ElevenLabs API key to environment variables:
            </p>
            <code className="text-xs bg-yellow-100 px-2 py-1 rounded mt-1 block">
              VITE_ELEVENLABS_API_KEY=your_api_key_here
            </code>
          </div>
        )}

        {/* Recent Conversation */}
        {conversationHistory.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <p className="text-sm font-medium text-gray-700">Recent Conversation:</p>
            {conversationHistory.slice(-4).map((msg, index) => (
              <div
                key={index}
                className={`p-2 rounded text-xs ${
                  msg.role === 'user' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                  {msg.isVoice && <Volume2 className="h-3 w-3" />}
                  <span className="text-xs opacity-75">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}