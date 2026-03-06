import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/ApiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MessageSquare, Mail, FileText, BarChart3, Send, Loader } from 'lucide-react';

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  timestamp: Date;
  unread: boolean;
}

interface Document {
  id: string;
  name: string;
  type: string;
  content: string;
}

const SimulationPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // State
  const [course, setCourse] = useState<any>(null);
  const [simId, setSimId] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; message: string; timestamp: Date }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [spreadsheet, setSpreadsheet] = useState<any>(null);
  const [loadingChat, setLoadingChat] = useState(false);

  // Load course and initialize simulation
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (!courseId) {
      navigate('/dashboard');
      return;
    }

    const init = async () => {
      try {
        // Get course details
        const courseRes = await apiClient.get(`/courses/${courseId}`);
        setCourse(courseRes.data);

        // Create simulation (correct endpoint)
        const simRes = await apiClient.post('/simulations/start', {
          course_id: courseId,
          user_id: user?.id
        });
        setSimId(simRes.data.id);

        // Load modules
        loadModules(simRes.data.id);
      } catch (error) {
        console.error('Error initializing simulation:', error);
      }
    };

    if (user) init();
  }, [courseId, user, loading, isAuthenticated, navigate]);

  const loadModules = async (simId: string) => {
    try {
      const [emailsRes, docsRes, spreadRes] = await Promise.all([
        apiClient.get(`/simulations/${simId}/emails`),
        apiClient.get(`/simulations/${simId}/documents`),
        apiClient.get(`/simulations/${simId}/spreadsheet`)
      ]);

      setEmails(emailsRes.data);
      setDocuments(docsRes.data);
      setSpreadsheet(spreadRes.data);
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    // Add user message
    const userMsg = { role: 'user' as const, message: chatInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setLoadingChat(true);

    try {
      const res = await apiClient.post(`/simulations/${simId}/message`, {
        message: chatInput,
        user_id: user?.id,
        course_id: courseId,
        conversationHistory: chatMessages.map(m => ({ role: m.role === 'ai' ? 'model' : 'user', parts: [{ text: m.message }] }))
      });
      const aiMsg = { role: 'ai' as const, message: res.data.ai_response, timestamp: new Date() };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errMsg = { role: 'ai' as const, message: '⚠️ Error al conectar con la IA. Verificá que el servidor esté en línea.', timestamp: new Date() };
      setChatMessages(prev => [...prev, errMsg]);
    } finally {
      setLoadingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando simulación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !courseId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{course?.title || 'Simulación'}</h1>
            <p className="text-sm text-muted-foreground">{course?.description}</p>
          </div>
          <div className="w-32" />
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Dynamic tabs driven by course.modules */}
        {(() => {
          const mods: string[] = Array.isArray(course?.modules) ? course.modules : [];
          const hasChatIA    = mods.includes('chat_ia');
          const hasEmail     = mods.includes('email_simulado') || mods.includes('email');
          const hasDocs      = mods.includes('documentos');
          const hasCalc      = mods.includes('hoja_calculo') || mods.includes('calculator');
          const defaultTab   = hasChatIA ? 'chat' : hasEmail ? 'email' : hasDocs ? 'docs' : 'sheet';
          const colCount     = [hasChatIA, hasEmail, hasDocs, hasCalc].filter(Boolean).length || 1;

          return (
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className={`grid w-full grid-cols-${colCount} mb-8`}>
                {hasChatIA && (
                  <TabsTrigger value="chat" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Chat IA</span>
                  </TabsTrigger>
                )}
                {hasEmail && (
                  <TabsTrigger value="email" className="gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="hidden sm:inline">Correo</span>
                  </TabsTrigger>
                )}
                {hasDocs && (
                  <TabsTrigger value="docs" className="gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Documentos</span>
                  </TabsTrigger>
                )}
                {hasCalc && (
                  <TabsTrigger value="sheet" className="gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Planilla</span>
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Chat IA Tab */}
              {hasChatIA && (
              <TabsContent value="chat">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {course?.ai_config?.base_role
                        ? `💬 ${course.title}`
                        : 'Asesor IA - Consulte sus dudas'}
                    </CardTitle>
                    {course?.ai_config?.course_context && (
                      <p className="text-sm text-muted-foreground mt-1 border-l-4 border-blue-400 pl-3">
                        📋 {course.ai_config.course_context.substring(0, 200)}...
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      {/* Chat Messages */}
                      <div className="bg-muted rounded-lg p-4 h-96 overflow-y-auto space-y-4 mb-4">
                        {chatMessages.length === 0 ? (
                          <p className="text-muted-foreground text-center py-20">
                            Inicia una conversación con el asesor IA
                          </p>
                        ) : (
                          chatMessages.map((msg, idx) => (
                            <div
                              key={idx}
                              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs px-4 py-2 rounded-lg ${
                                  msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-secondary-foreground'
                                }`}
                              >
                                <p>{msg.message}</p>
                                <span className="text-xs opacity-70">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                        {loadingChat && (
                          <div className="flex gap-2">
                            <Loader className="w-4 h-4 animate-spin" />
                            <p className="text-sm text-muted-foreground">El asesor está escribiendo...</p>
                          </div>
                        )}
                      </div>

                      {/* Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          onKeyPress={e => e.key === 'Enter' && sendMessage()}
                          placeholder="Escribe tu mensaje..."
                          className="flex-1 px-4 py-2 border rounded-lg"
                        />
                        <Button
                          onClick={sendMessage}
                          disabled={!chatInput.trim() || loadingChat}
                          className="gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Enviar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              )}

              {/* Email Tab */}
              {hasEmail && (
              <TabsContent value="email">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card className="lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="text-lg">Bandeja ({emails.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {emails.length === 0 && <p className="text-sm text-muted-foreground">No hay correos.</p>}
                        {emails.map(email => (
                          <button
                            key={email.id}
                            onClick={() => setSelectedEmail(email)}
                            className={`w-full text-left p-3 rounded-lg border transition ${
                              selectedEmail?.id === email.id
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <p className={`text-sm font-semibold ${email.unread ? 'font-bold' : ''}`}>
                              {email.from}
                            </p>
                            <p className="text-xs truncate opacity-75">{email.subject}</p>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>
                        {selectedEmail ? selectedEmail.subject : 'Selecciona un correo'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedEmail ? (
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground">De:</p>
                            <p className="font-semibold">{selectedEmail.from}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Mensaje:</p>
                            <p className="mt-2">{selectedEmail.body}</p>
                          </div>
                          <Button className="w-full gap-2">
                            <Mail className="w-4 h-4" />
                            Responder
                          </Button>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          Selecciona un correo de la bandeja
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              )}

              {/* Documents Tab */}
              {hasDocs && (
              <TabsContent value="docs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.length === 0 && <p className="text-muted-foreground">No hay documentos disponibles.</p>}
                  {documents.map(doc => (
                    <Card key={doc.id} className="cursor-pointer hover:shadow-lg transition">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          {doc.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted rounded p-3 max-h-32 overflow-y-auto text-sm">
                          {doc.content}
                        </div>
                        <Button className="w-full mt-4" variant="outline">
                          Ver Documento Completo
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              )}

              {/* Spreadsheet Tab */}
              {hasCalc && (
              <TabsContent value="sheet">
                <Card>
                  <CardHeader>
                    <CardTitle>{spreadsheet?.name || 'Planilla de Cálculos'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted">
                            <th className="text-left p-3 font-semibold">Item</th>
                            <th className="text-right p-3 font-semibold">Valor</th>
                            <th className="text-right p-3 font-semibold">Moneda</th>
                          </tr>
                        </thead>
                        <tbody>
                          {spreadsheet?.data?.map((row: any, idx: number) => (
                            <tr key={idx} className="border-b hover:bg-muted/50">
                              <td className="p-3">{row.item}</td>
                              <td className="text-right p-3 font-semibold">${row.value?.toLocaleString()}</td>
                              <td className="text-right p-3 text-muted-foreground">{row.currency}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {spreadsheet?.formulas && (
                      <div className="mt-6 p-4 bg-muted rounded">
                        <h4 className="font-semibold mb-2">Fórmulas Utilizadas:</h4>
                        {Object.entries(spreadsheet.formulas).map(([key, formula]) => (
                          <p key={key} className="text-sm font-mono">
                            <span className="text-primary">{key}:</span> {formula as string}
                          </p>
                        ))}
                      </div>
                    )}

                    <Button className="w-full mt-6" variant="outline">
                      📥 Descargar Planilla (Excel)
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              )}
            </Tabs>
          );
        })()}
      </main>
    </div>
  );
};

export default SimulationPage;
