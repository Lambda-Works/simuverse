import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { ArrowLeft, Send, AlertTriangle, Clock, FileText, Pause, Square, MessageCircle } from 'lucide-react';

interface SimMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/simulation-chat`;

const SimulationPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [simulation, setSimulation] = useState<any>(null);
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [crisisActive, setCrisisActive] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  // Fetch course & create/resume simulation
  useEffect(() => {
    if (!user || !courseId) return;
    const init = async () => {
      const { data: courseData } = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (!courseData) { toast.error('Curso no encontrado'); navigate('/dashboard'); return; }
      setCourse(courseData);

      // Check for existing active simulation
      const { data: existing } = await supabase.from('simulations')
        .select('*').eq('user_id', user.id).eq('course_id', courseId).eq('status', 'active').maybeSingle();

      let sim = existing;
      if (!sim) {
        const { data: newSim, error } = await supabase.from('simulations')
          .insert({ user_id: user.id, course_id: courseId }).select().single();
        if (error) { toast.error(error.message); return; }
        sim = newSim;

        // Log simulation start
        await supabase.from('simulation_logs').insert({
          simulation_id: sim.id, user_id: user.id, event_type: 'simulation_start',
          event_data: { course_id: courseId },
        });
      }
      setSimulation(sim);

      // Load existing messages
      const { data: msgs } = await supabase.from('simulation_messages')
        .select('*').eq('simulation_id', sim.id).order('created_at', { ascending: true });
      if (msgs) setMessages(msgs.map(m => ({ id: m.id, role: m.role as any, content: m.content, created_at: m.created_at })));
    };
    init();
  }, [user, courseId, navigate]);

  // Timer
  useEffect(() => {
    if (simulation?.status === 'active') {
      timerRef.current = setInterval(() => {
        const started = new Date(simulation.started_at).getTime();
        setElapsedMinutes(Math.floor((Date.now() - started) / 60000));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [simulation]);

  // Crisis engine
  useEffect(() => {
    if (!course || !simulation) return;
    const crisisEvents = (course.crisis_events || []) as Array<{ trigger_minutes: number; event_text: string; severity: string }>;
    const triggered = crisisEvents.find(e => e.trigger_minutes === elapsedMinutes);
    if (triggered) {
      setCrisisActive(true);
      const crisisMsg: SimMessage = { role: 'system', content: `⚠️ EVENTO DE CRISIS: ${triggered.event_text}` };
      setMessages(prev => [...prev, crisisMsg]);
      // Save crisis log
      supabase.from('simulation_logs').insert({
        simulation_id: simulation.id, user_id: user!.id, event_type: 'crisis_triggered',
        event_data: triggered,
      });
      setTimeout(() => setCrisisActive(false), 10000);
    }
  }, [elapsedMinutes, course, simulation, user]);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !simulation || !user) return;
    const userMsg: SimMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    // Save user message
    await supabase.from('simulation_messages').insert({
      simulation_id: simulation.id, user_id: user.id, role: 'user', content: userMsg.content,
    });

    // Log user action
    await supabase.from('simulation_logs').insert({
      simulation_id: simulation.id, user_id: user.id, event_type: 'message_sent',
      event_data: { content_length: userMsg.content.length },
    });

    // Stream AI response
    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          simulation_id: simulation.id,
          course_id: courseId,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          ai_config: course.ai_config,
          course_context: {
            title: course.title,
            category: course.category,
            modules: course.modules,
          },
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      // Stream SSE
      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant' && !last.id) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch { textBuffer = line + '\n' + textBuffer; break; }
        }
      }

      // Save assistant message
      if (assistantContent) {
        await supabase.from('simulation_messages').insert({
          simulation_id: simulation.id, user_id: user.id, role: 'assistant', content: assistantContent,
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Error de comunicación con IA');
    }
    setSending(false);
  };

  const endSimulation = async () => {
    if (!simulation || !user) return;
    await supabase.from('simulations').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', simulation.id);
    await supabase.from('simulation_logs').insert({
      simulation_id: simulation.id, user_id: user.id, event_type: 'simulation_end',
      event_data: { elapsed_minutes: elapsedMinutes, total_messages: messages.length },
    });
    toast.success('Simulación finalizada');
    navigate('/dashboard');
  };

  if (!course || !simulation) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className={`min-h-screen bg-background flex flex-col ${crisisActive ? 'crisis-pulse' : ''}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-50 transition-colors duration-500 ${crisisActive ? 'bg-crisis/10 border-crisis/30' : 'bg-card/80 backdrop-blur-xl'}`}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="font-semibold text-sm">{course.title}</h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                {crisisActive && <Badge variant="destructive" className="text-xs animate-pulse"><AlertTriangle className="w-3 h-3 mr-1" /> Crisis</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{elapsedMinutes}min</span>
            </div>
            <Badge variant="outline" className="text-xs">
              <MessageCircle className="w-3 h-3 mr-1" /> {messages.filter(m => m.role === 'user').length} msgs
            </Badge>
            <Button variant="destructive" size="sm" onClick={endSimulation}>
              <Square className="w-4 h-4 mr-1" /> Finalizar
            </Button>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 flex flex-col container mx-auto px-4 max-w-4xl">
        <ScrollArea className="flex-1 py-4">
          <div className="space-y-4">
            {/* Initial system message */}
            {messages.length === 0 && (
              <div className="text-center py-8 fade-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Simulación Iniciada</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
                  {course.description || 'Interactúe con el personaje IA para completar la simulación.'}
                </p>
                <p className="text-xs text-muted-foreground mt-3">Escriba su primer mensaje para comenzar...</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} fade-in`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' :
                  msg.role === 'system' ? 'bg-warning/10 text-warning border border-warning/30' :
                  'bg-card border rounded-bl-md'
                }`}>
                  {msg.role === 'system' && <AlertTriangle className="w-4 h-4 inline mr-2" />}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="py-4 border-t">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Escriba su mensaje..."
              disabled={sending}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" disabled={sending || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SimulationPage;
