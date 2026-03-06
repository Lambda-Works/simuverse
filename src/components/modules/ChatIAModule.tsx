import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Loader, AlertCircle, Zap } from 'lucide-react';
import { chatService } from '../../services/ChatService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isLoading?: boolean;
  tokensUsed?: { input: number; output: number };
}

interface ChatIAModuleProps {
  scenario: any;
  config: any;
  logAction: (actionType: string, description: string, metadata: Record<string, any>) => void;
  updateState: (state: Record<string, any>) => void;
}

const ChatIAModule: React.FC<ChatIAModuleProps> = ({
  scenario,
  config,
  logAction,
  updateState,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `¡Hola! Soy tu asistente de IA especializado en ${scenario?.familyType || 'RRHH'}. Estoy aquí para ayudarte a resolver dudas y tomar mejores decisiones. ¿En qué puedo ayudarte?`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesCount = useRef(0);
  const [totalTokens, setTotalTokens] = useState({ input: 0, output: 0 });

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Simulate AI response (replace with actual API call)
  const generateAIResponse = async (userMessage: string): Promise<ChatMessage> => {
    try {
      const conversationHistory = messages
        .filter((m) => m.role !== 'assistant' || !m.isLoading)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      // Call real LLM service
      const response = await chatService.generateResponse(
        userMessage,
        conversationHistory,
        scenario?.familyType || 'rrhh'
      );

      return {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response.text,
        timestamp: response.timestamp,
        tokensUsed: response.tokens,
      };
    } catch (err) {
      console.error('Error generating response:', err);
      throw err;
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputText,
      timestamp: new Date().toISOString(),
    };

    // Add user message
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setError(null);
    messagesCount.current += 1;

    // Log user message
    logAction('chat_message_sent', inputText, {
      moduleName: 'ChatIA',
      messageLength: inputText.length,
      messageIndex: messagesCount.current,
      timestamp: new Date().toISOString(),
      familyType: scenario?.familyType,
    });

    try {
      // Generate response using real LLM
      const aiResponse = await generateAIResponse(inputText);

      setMessages((prev) => [...prev, aiResponse]);
      messagesCount.current += 1;

      // Update token tracking
      if (aiResponse.tokensUsed) {
        setTotalTokens((prev) => ({
          input: prev.input + aiResponse.tokensUsed!.input,
          output: prev.output + aiResponse.tokensUsed!.output,
        }));
      }

      logAction('chat_response_received', aiResponse.content.substring(0, 100), {
        moduleName: 'ChatIA',
        responseLength: aiResponse.content.length,
        messageIndex: messagesCount.current,
        tokensUsed: aiResponse.tokensUsed,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setError('Error al obtener respuesta del asistente. Intenta de nuevo.');
      logAction('chat_error', 'Failed to get AI response', {
        moduleName: 'ChatIA',
        error: String(err),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteChat = () => {
    updateState({
      chatCompleted: true,
      messagesExchanged: messagesCount.current,
      lastChatAction: new Date().toISOString(),
    });

    logAction('chat_completed', `Chat session completed with ${messagesCount.current} messages`, {
      moduleName: 'ChatIA',
      totalMessages: messagesCount.current,
      timestamp: new Date().toISOString(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <MessageCircle className="w-8 h-8 text-purple-600" />
        <div>
          <h3 className="text-2xl font-bold">Asistente IA</h3>
          <p className="text-sm text-gray-600">Especialista en {scenario?.familyType || 'Administración'}</p>
        </div>
      </div>

      {/* System Prompt Info */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-900">
        <p className="font-semibold">💡 Rol del asistente:</p>
        <p className="mt-1">Puedo ayudarte con dudas sobre cálculos, documentos y normativa aplicable.</p>
      </div>

      {/* Messages Container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-gray-50 rounded-lg border border-gray-300 p-4 space-y-4"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-gray-900 border border-gray-300 rounded-bl-none'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p
                className={`text-xs mt-1 ${
                  msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 px-4 py-3 rounded-lg border border-gray-300 rounded-bl-none flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin text-purple-600" />
              <span className="text-sm">Escribiendo...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu pregunta o comentario (Shift+Enter para nueva línea)..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:bg-gray-300 transition font-semibold flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Enviar
          </button>
        </div>

        {/* Stats */}
        <div className="flex justify-between text-xs text-gray-500">
          <div>Mensajes: {messagesCount.current}</div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Tokens: {totalTokens.input} in / {totalTokens.output} out
          </div>
        </div>
      </div>

      {/* Complete Button */}
      <button
        onClick={handleCompleteChat}
        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
      >
        Completar Consulta con IA
      </button>
    </div>
  );
};

export default ChatIAModule;
