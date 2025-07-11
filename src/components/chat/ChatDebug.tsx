import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Bug, Database } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AI_CONFIG } from '@/config/ai';
import { DatabaseService } from '@/services/ai/database-service';
import { debugOpenAIRequest } from '@/services/ai/debug-openai';

export function ChatDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const runDebug = () => {
    const info = {
      provider: AI_CONFIG.provider,
      hasOpenAIKey: !!AI_CONFIG.openai.apiKey,
      keyLength: AI_CONFIG.openai.apiKey?.length || 0,
      keyPrefix: AI_CONFIG.openai.apiKey?.substring(0, 8) || 'none',
      model: AI_CONFIG.openai.model,
      baseUrl: AI_CONFIG.openai.baseUrl,
      envKeys: {
        VITE_OPENAI_API_KEY: !!(import.meta.env?.VITE_OPENAI_API_KEY),
        keyFromEnv: (import.meta.env?.VITE_OPENAI_API_KEY)?.substring(0, 8) || 'none'
      }
    };
    setDebugInfo(info);
  };

  const testAPIKey = async () => {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${AI_CONFIG.openai.apiKey}`
        }
      });
      
      if (response.ok) {
        setDebugInfo(prev => ({ ...prev, apiTest: 'SUCCESS - API key is valid' }));
      } else {
        const error = await response.text();
        setDebugInfo(prev => ({ ...prev, apiTest: `FAILED - ${response.status}: ${error}` }));
      }
    } catch (error) {
      setDebugInfo(prev => ({ ...prev, apiTest: `ERROR - ${error}` }));
    }
  };

  const testDatabase = async () => {
    try {
      setDebugInfo(prev => ({ ...prev, dbTest: 'Testing database connection...' }));
      
      const dbService = DatabaseService.getInstance();
      const context = await dbService.getPlatformContext();
      
      setDebugInfo(prev => ({ 
        ...prev, 
        dbTest: 'SUCCESS - Database connected',
        dbData: {
          employees: context.employees.length,
          courses: context.courses.length,
          trainings: context.trainings.length,
          certificates: context.expiringCertificates.length,
          sampleEmployee: context.employees[0] ? `${context.employees[0].first_name} ${context.employees[0].last_name}` : 'None',
          sampleCourse: context.courses[0] ? context.courses[0].title : 'None'
        }
      }));
    } catch (error) {
      setDebugInfo(prev => ({ 
        ...prev, 
        dbTest: `FAILED - ${error}`,
        dbData: null
      }));
    }
  };

  const testOpenAI = async () => {
    try {
      setDebugInfo(prev => ({ ...prev, openaiTest: 'Testing OpenAI function calling...' }));
      
      const result = await debugOpenAIRequest();
      
      setDebugInfo(prev => ({ 
        ...prev, 
        openaiTest: 'Check console for detailed results',
        openaiResult: result ? 'SUCCESS' : 'FAILED'
      }));
    } catch (error) {
      setDebugInfo(prev => ({ 
        ...prev, 
        openaiTest: `FAILED - ${error}`,
        openaiResult: null
      }));
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-blue-600">
          <Bug className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>AI Chat Debug Info</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={runDebug} size="sm">Get Debug Info</Button>
            <Button onClick={testAPIKey} size="sm" variant="outline">Test API Key</Button>
            <Button onClick={testDatabase} size="sm" variant="outline">
              <Database className="h-3 w-3 mr-1" />
              Test Database
            </Button>
            <Button onClick={testOpenAI} size="sm" variant="outline">
              🔧 Test Function Calling
            </Button>
          </div>
          
          {debugInfo && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Configuration Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>Provider:</div>
                  <div className="font-mono">{debugInfo.provider}</div>
                  
                  <div>Has API Key:</div>
                  <div>{debugInfo.hasOpenAIKey ? '✅ Yes' : '❌ No'}</div>
                  
                  <div>Key Length:</div>
                  <div className="font-mono">{debugInfo.keyLength} characters</div>
                  
                  <div>Key Prefix:</div>
                  <div className="font-mono">{debugInfo.keyPrefix}...</div>
                  
                  <div>Model:</div>
                  <div className="font-mono">{debugInfo.model}</div>
                  
                  <div>Base URL:</div>
                  <div className="font-mono text-xs break-all">{debugInfo.baseUrl}</div>
                </div>
                
                <hr className="my-2" />
                <div className="space-y-1">
                  <div className="font-medium">Environment Variables:</div>
                  <div>VITE_OPENAI_API_KEY: {debugInfo.envKeys.VITE_OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}</div>
                  <div>Env Key Prefix: <span className="font-mono">{debugInfo.envKeys.keyFromEnv}...</span></div>
                </div>
                
                {debugInfo.apiTest && (
                  <>
                    <hr className="my-2" />
                    <div className="space-y-1">
                      <div className="font-medium">API Test Result:</div>
                      <div className={`p-2 rounded text-xs ${
                        debugInfo.apiTest.includes('SUCCESS') 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {debugInfo.apiTest}
                      </div>
                    </div>
                  </>
                )}
                
                {debugInfo.dbTest && (
                  <>
                    <hr className="my-2" />
                    <div className="space-y-1">
                      <div className="font-medium">Database Test Result:</div>
                      <div className={`p-2 rounded text-xs ${
                        debugInfo.dbTest.includes('SUCCESS') 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {debugInfo.dbTest}
                      </div>
                      
                      {debugInfo.dbData && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                          <div className="font-medium mb-1">Database Content:</div>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            <div>Employees:</div><div>{debugInfo.dbData.employees}</div>
                            <div>Courses:</div><div>{debugInfo.dbData.courses}</div>
                            <div>Trainings:</div><div>{debugInfo.dbData.trainings}</div>
                            <div>Certificates:</div><div>{debugInfo.dbData.certificates}</div>
                            <div>Sample Employee:</div><div>{debugInfo.dbData.sampleEmployee}</div>
                            <div>Sample Course:</div><div>{debugInfo.dbData.sampleCourse}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                {debugInfo.openaiTest && (
                  <>
                    <hr className="my-2" />
                    <div className="space-y-1">
                      <div className="font-medium">OpenAI Function Calling Test:</div>
                      <div className={`p-2 rounded text-xs ${
                        debugInfo.openaiResult === 'SUCCESS' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {debugInfo.openaiTest}
                      </div>
                      {debugInfo.openaiResult && (
                        <div className="text-xs">
                          Result: {debugInfo.openaiResult}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}