import React, { useState, useMemo } from 'react';
import { Mail, MessageSquare, Send, Archive } from 'lucide-react';

interface Message {
  id: string;
  from: string;
  subject: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  templateId?: string;
  responses?: {
    id: string;
    content: string;
    timestamp: string;
    isCorrect?: boolean;
  }[];
}

interface InboxModuleProps {
  scenario: any;
  config: any;
  logAction: (actionType: string, description: string, metadata: Record<string, any>) => void;
  updateState: (state: Record<string, any>) => void;
}

const InboxModule: React.FC<InboxModuleProps> = ({
  scenario,
  config,
  logAction,
  updateState,
}) => {
  const [messages, setMessages] = useState<Message[]>(
    scenario?.inboxMessages || [
      {
        id: '1',
        from: 'Gerente de RRHH',
        subject: 'Solicitud de aumento de pensión',
        body: 'El empleado Juan García solicita revisión de su aporte a la AFP. ¿Puedes analizar su situación?',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isRead: true,
        responses: [],
      },
      {
        id: '2',
        from: 'Auditor Externo',
        subject: 'Validación de beneficiarios',
        body: 'Necesitamos confirmar la lista de beneficiarios actualizada para cumplimiento normativo.',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        isRead: false,
        responses: [],
      },
      {
        id: '3',
        from: 'Supervisor',
        subject: 'Reporte de inconsistencias',
        body: 'Se encontraron discrepancias en los registros del mes pasado. ¿Podrías revisar?',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        isRead: false,
        responses: [],
      },
    ]
  );

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [responseText, setResponseText] = useState('');
  const [archivedMessages, setArchivedMessages] = useState<string[]>([]);

  // Mark as read
  const markAsRead = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, isRead: true } : msg))
    );

    logAction('message_read', `Read message from ${messages.find((m) => m.id === messageId)?.from}`, {
      moduleName: 'Inbox',
      messageId,
      timestamp: new Date().toISOString(),
    });
  };

  // Send response
  const handleSendResponse = (messageId: string) => {
    if (!responseText.trim()) return;

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              responses: [
                ...(msg.responses || []),
                {
                  id: `response-${Date.now()}`,
                  content: responseText,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : msg
      )
    );

    logAction('message_response', `Responded to message: ${responseText.substring(0, 50)}...`, {
      moduleName: 'Inbox',
      messageId,
      responseLength: responseText.length,
      timestamp: new Date().toISOString(),
    });

    setResponseText('');
  };

  // Archive message
  const handleArchiveMessage = (messageId: string) => {
    setArchivedMessages((prev) => [...prev, messageId]);

    logAction('message_archived', `Archived message ${messageId}`, {
      moduleName: 'Inbox',
      messageId,
      timestamp: new Date().toISOString(),
    });
  };

  const activeMessages = useMemo(() => {
    return messages.filter((m) => !archivedMessages.includes(m.id));
  }, [messages, archivedMessages]);

  const unreadCount = activeMessages.filter((m) => !m.isRead).length;

  const handleSubmitInbox = () => {
    updateState({
      inboxCompleted: true,
      messagesResponded: messages.filter((m) => (m.responses?.length || 0) > 0).length,
      totalMessages: messages.length,
      lastInboxAction: new Date().toISOString(),
    });

    logAction('inbox_completed', `Completed inbox with ${messages.filter((m) => m.responses?.length).length} responses`, {
      moduleName: 'Inbox',
      totalMessages: messages.length,
      respondedMessages: messages.filter((m) => (m.responses?.length || 0) > 0).length,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-8 h-8 text-blue-600" />
        <h3 className="text-2xl font-bold">Bandeja de Entrada</h3>
        {unreadCount > 0 && (
          <span className="ml-auto bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {unreadCount} sin leer
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
            {activeMessages.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {activeMessages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (!msg.isRead) markAsRead(msg.id);
                    }}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                      selectedMessage?.id === msg.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!msg.isRead && (
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${!msg.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {msg.from}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{msg.subject}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString('es-ES')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <Archive className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No hay mensajes</p>
              </div>
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <div className="bg-white rounded-lg border border-gray-300 p-6 space-y-4">
              {/* Header */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-xl font-bold text-gray-900">{selectedMessage.subject}</h3>
                <p className="text-sm text-gray-600 mt-1">De: {selectedMessage.from}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(selectedMessage.timestamp).toLocaleString('es-ES')}
                </p>
              </div>

              {/* Body */}
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-gray-800 leading-relaxed">{selectedMessage.body}</p>
              </div>

              {/* Responses */}
              {selectedMessage.responses && selectedMessage.responses.length > 0 && (
                <div className="bg-blue-50 p-4 rounded border border-blue-200 space-y-3">
                  <p className="font-semibold text-blue-900">Tus respuestas:</p>
                  {selectedMessage.responses.map((resp) => (
                    <div key={resp.id} className="bg-white p-3 rounded border border-blue-100">
                      <p className="text-gray-800 text-sm">{resp.content}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(resp.timestamp).toLocaleString('es-ES')}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Response Compose */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Enviar respuesta:</label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Escribe tu respuesta..."
                  rows={3}
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSendResponse(selectedMessage.id)}
                    disabled={!responseText.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 transition font-semibold"
                  >
                    <Send className="w-4 h-4" />
                    Enviar
                  </button>
                  <button
                    onClick={() => handleArchiveMessage(selectedMessage.id)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                    title="Archivar mensaje"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-300 p-12 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Selecciona un mensaje para verlo</p>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmitInbox}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
      >
        Completar Bandeja de Entrada
      </button>
    </div>
  );
};

export default InboxModule;
