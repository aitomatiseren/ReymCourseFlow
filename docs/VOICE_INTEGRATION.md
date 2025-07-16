# ElevenLabs Voice Integration Documentation

## Overview

The ReymCourseFlow training management system now includes comprehensive voice integration powered by ElevenLabs API. This feature enables users to interact with the system using voice commands for training scheduling, employee management, and AI chat functionality.

## Features

### 1. Voice Chat Integration
- **Location**: Main chat panel (accessible via chat bubble in bottom right)
- **Functionality**: Text-to-speech responses and voice input recognition
- **Commands**: Natural language conversation with AI assistant

### 2. Training Scheduler Voice Commands
- **Location**: Training scheduler page and voice training scheduler component
- **Functionality**: Voice-controlled training scheduling and employee management
- **Commands**: Specific training-related voice commands

## Setup Instructions

### 1. ElevenLabs API Configuration

1. **Get ElevenLabs API Key**:
   - Sign up at [ElevenLabs.io](https://elevenlabs.io)
   - Navigate to your profile settings
   - Generate an API key

2. **Configure Environment Variables**:
   Add the following to your `.env` file:
   ```bash
   VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   VITE_ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
   ```

3. **Voice Selection** (Optional):
   - Use the default voice ID (`pNInz6obpgDQGcFmaJgB`) or
   - Choose a different voice from ElevenLabs and update `VITE_ELEVENLABS_VOICE_ID`

### 2. Browser Requirements

- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Limited speech recognition support
- **Safari**: Basic support
- **Mobile**: Limited support due to browser restrictions

### 3. Permissions

Users will need to grant microphone permissions when using voice features for the first time.

## Usage Guide

### Voice Chat (General AI Assistant)

1. **Access**: Click the chat bubble in the bottom right corner
2. **Switch to Voice**: Click the "Voice Chat" tab
3. **Start**: Click "Start Voice Chat" button
4. **Speak**: Wait for the "Listening..." indicator and speak your query
5. **Response**: The AI will respond with both text and voice

**Example Commands**:
- "What trainings are scheduled for next week?"
- "Show me John Doe's certificates"
- "How many VCA trainings do we have this month?"

### Training Scheduler Voice Commands

1. **Access**: Navigate to the training scheduler page
2. **Voice Panel**: Look for the "Voice Training Scheduler" component
3. **Start**: Click "Start Voice Commands" button
4. **Speak**: Use specific training commands

**Training-Specific Commands**:
- `"Schedule VCA training for John Doe next week"`
- `"Find employee Sarah Johnson"`
- `"Check availability for Mike Smith on Friday"`
- `"What courses are available?"`
- `"Show me the calendar for next week"`
- `"Book a full day forklift course for 5 people"`

### Voice Command Types

#### 1. Schedule Training
- **Pattern**: "Schedule [course] for [employee] on [date]"
- **Examples**:
  - "Schedule BHV training for the operations team next Tuesday"
  - "Book a Code 95 course for 10 drivers in March"
  - "Create a safety training for new employees"

#### 2. Find Employee
- **Pattern**: "Find employee [name]"
- **Examples**:
  - "Find employee John Smith"
  - "Search for Sarah from accounting"
  - "Look up Mike Johnson"

#### 3. Check Availability
- **Pattern**: "Check availability for [employee] on [date]"
- **Examples**:
  - "Check availability for John Doe on Monday"
  - "Is Sarah available next week?"
  - "When is Mike Smith free?"

#### 4. Course Information
- **Pattern**: "What courses..." or "List courses..."
- **Examples**:
  - "What courses are available?"
  - "List all training types"
  - "What can I schedule?"

#### 5. Calendar Views
- **Pattern**: "Show calendar..." or "What's scheduled..."
- **Examples**:
  - "Show calendar for next week"
  - "What's scheduled for March?"
  - "Show me today's trainings"

## Technical Implementation

### Core Components

#### 1. ElevenLabsService (`/src/services/ai/elevenlabs-service.ts`)
- **Singleton service** for ElevenLabs API integration
- **Text-to-Speech**: Converts AI responses to audio
- **Speech Recognition**: Browser-based speech-to-text
- **Voice Command Parsing**: Extracts training-specific information

#### 2. VoiceChat Component (`/src/components/chat/VoiceChat.tsx`)
- **General voice assistant** integrated into main chat system
- **Navigation capabilities** for voice-controlled app navigation
- **Real-time conversation** with visual feedback

#### 3. VoiceTrainingScheduler (`/src/components/training/VoiceTrainingScheduler.tsx`)
- **Training-specific voice interface** with specialized commands
- **Scheduling integration** with callback functions
- **Employee search** and availability checking

### Integration Points

#### 1. Chat System Integration
```typescript
// Updated ChatPanel.tsx to include voice tabs
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsTrigger value="text">Text Chat</TabsTrigger>
  <TabsTrigger value="voice">Voice Chat</TabsTrigger>
</Tabs>
```

#### 2. Training Scheduler Integration
```typescript
// VoiceTrainingScheduler can be added to training pages
<VoiceTrainingScheduler
  onScheduleTraining={(params) => handleScheduleTraining(params)}
  onFindEmployee={(query) => handleFindEmployee(query)}
  onCheckAvailability={(name, date) => handleCheckAvailability(name, date)}
/>
```

### API Configuration

#### Voice Settings
```typescript
const voiceSettings = {
  stability: 0.5,           // Voice stability (0-1)
  similarity_boost: 0.75,   // Voice similarity (0-1)
  style: 0.0,              // Voice style (0-1)
  use_speaker_boost: true   // Enhanced clarity
};
```

#### Model Configuration
```typescript
const config = {
  model: 'eleven_multilingual_v2',  // Supports multiple languages
  voiceId: 'pNInz6obpgDQGcFmaJgB',  // Default voice
  apiKey: process.env.VITE_ELEVENLABS_API_KEY
};
```

## Troubleshooting

### Common Issues

#### 1. "ElevenLabs not configured" Error
- **Solution**: Verify API key is correctly set in `.env` file
- **Check**: Restart development server after adding environment variables

#### 2. Microphone Permission Denied
- **Solution**: Enable microphone permissions in browser settings
- **Chrome**: Settings → Privacy & Security → Site Settings → Microphone

#### 3. Voice Recognition Not Working
- **Solution**: Ensure you're using a supported browser (Chrome/Edge recommended)
- **Check**: Try speaking clearly and avoid background noise

#### 4. Audio Playback Issues
- **Solution**: Check system audio settings and browser permissions
- **Alternative**: Use text-only mode if audio fails

#### 5. API Rate Limits
- **Solution**: ElevenLabs has rate limits based on your plan
- **Monitoring**: Check API usage in ElevenLabs dashboard

### Performance Optimization

#### 1. Audio Caching
- Responses are not cached by default
- Consider implementing client-side caching for frequently used phrases

#### 2. Voice Recognition Timeout
- Default timeout is 8 seconds
- Adjust in service configuration if needed

#### 3. API Usage Monitoring
- Monitor API usage to avoid unexpected charges
- Consider implementing usage tracking

## Future Enhancements

### Planned Features

1. **Multi-language Support**
   - Voice recognition in Dutch/English
   - Localized voice responses

2. **Advanced Training Commands**
   - Complex scheduling with multiple parameters
   - Bulk operations via voice

3. **Employee Profiles Integration**
   - Voice-controlled employee management
   - Availability checking with conflict detection

4. **Offline Mode**
   - Basic voice recognition without API calls
   - Cached responses for common queries

### Technical Improvements

1. **Error Handling**
   - Improved error messages
   - Fallback mechanisms

2. **Performance**
   - Response caching
   - Reduced API calls

3. **User Experience**
   - Visual feedback improvements
   - Voice command hints

## Security Considerations

### Data Privacy
- Voice data is processed by ElevenLabs
- No permanent storage of voice recordings
- Transcriptions are temporarily stored for conversation context

### API Security
- API keys are stored in environment variables
- No client-side exposure of sensitive data
- Rate limiting prevents abuse

### Permissions
- Microphone access required for voice input
- All voice features respect user permissions
- Users can disable voice features at any time

## Support

For issues or questions regarding voice integration:

1. **Check Configuration**: Verify API keys and environment setup
2. **Browser Compatibility**: Ensure you're using a supported browser
3. **API Status**: Check ElevenLabs service status
4. **Logs**: Review browser console for error messages

## API Documentation

For detailed ElevenLabs API documentation:
- [ElevenLabs API Docs](https://docs.elevenlabs.io/)
- [Voice Settings Guide](https://docs.elevenlabs.io/api-reference/text-to-speech)
- [Voice Library](https://docs.elevenlabs.io/api-reference/voices)

---

*Last updated: July 2025*
*Version: 1.0.0*