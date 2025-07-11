import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { AIServiceFactory } from '@/services/ai/ai-factory';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function ChatSettings() {
  const [status, setStatus] = useState<{ provider: string; configured: boolean; error?: string }>({
    provider: 'local',
    configured: false
  });

  useEffect(() => {
    updateStatus();
  }, []);

  const updateStatus = () => {
    const providerStatus = AIServiceFactory.getProviderStatus();
    setStatus(providerStatus);
  };

  const switchProvider = (provider: 'local' | 'openai' | 'anthropic') => {
    AIServiceFactory.switchProvider(provider);
    updateStatus();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-blue-600">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>AI Chat Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Current Provider</CardTitle>
              <CardDescription className="text-xs">
                Active AI service provider for chat functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{status.provider}</span>
                <div className="flex items-center gap-2">
                  {status.configured ? (
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Not Configured
                    </Badge>
                  )}
                </div>
              </div>
              
              {status.error && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  {status.error}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Provider Options</CardTitle>
              <CardDescription className="text-xs">
                Switch between different AI providers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={status.provider === 'local' ? 'default' : 'outline'}
                size="sm"
                onClick={() => switchProvider('local')}
                className="w-full justify-start text-xs"
              >
                Local Knowledge Base
                <Badge variant="secondary" className="ml-auto text-xs">
                  Always Available
                </Badge>
              </Button>
              
              <Button
                variant={status.provider === 'openai' ? 'default' : 'outline'}
                size="sm"
                onClick={() => switchProvider('openai')}
                className="w-full justify-start text-xs"
              >
                OpenAI GPT
                <Badge variant={status.configured && status.provider === 'openai' ? 'default' : 'destructive'} className="ml-auto text-xs">
                  {status.configured && status.provider === 'openai' ? 'Ready' : 'API Key Required'}
                </Badge>
              </Button>
              
              <Button
                variant={status.provider === 'anthropic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => switchProvider('anthropic')}
                className="w-full justify-start text-xs"
                disabled
              >
                Anthropic Claude
                <Badge variant="secondary" className="ml-auto text-xs">
                  Coming Soon
                </Badge>
              </Button>
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Local:</strong> Uses built-in platform knowledge, always available</p>
            <p><strong>OpenAI:</strong> Advanced AI with natural language understanding</p>
            <p><strong>Setup:</strong> Add VITE_OPENAI_API_KEY to your .env file</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}