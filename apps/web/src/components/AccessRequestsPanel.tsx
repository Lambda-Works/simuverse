'use client'
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/services/ApiClient';
import { AlertCircle, CheckCircle2, Clock, CreditCard, Mail, Phone, RefreshCw, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AccessRequest {
  id: number;
  student_id: string;
  course_id: string;
  student_name: string;
  student_email: string;
  course_name: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function AccessRequestsPanel() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedReq, setSelectedReq] = useState<AccessRequest | null>(null);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/access-requests', { params: { status: filter } });
      setRequests(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const handleAction = async () => {
    if (!selectedReq) return;
    setProcessing(true);
    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      await apiClient.put(`/access-requests/${selectedReq.id}`, {
        status: newStatus,
        admin_notes: notes,
      });
      toast.success(action === 'approve' ? '✅ Solicitud aprobada' : '❌ Solicitud rechazada');
      setSelectedReq(null);
      setNotes('');
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.message);
    } finally {
      setProcessing(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'pending') return <Badge className="bg-amber-100 text-amber-800 border-amber-300 border text-xs">⏳ Pendiente</Badge>;
    if (status === 'approved') return <Badge className="bg-green-100 text-green-800 border-green-300 border text-xs">✅ Aprobada</Badge>;
    return <Badge className="bg-red-100 text-red-800 border-red-300 border text-xs">❌ Rechazada</Badge>;
  };

  const pending = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-amber-500" />
            Solicitudes de Acceso
            {pending > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pending}</span>
            )}
          </h2>
          <p className="text-muted-foreground mt-1">
            Alumnos registrados que solicitan acceso a simulaciones. Aprobá o rechazá cada solicitud.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="approved">Aprobadas</SelectItem>
              <SelectItem value="rejected">Rechazadas</SelectItem>
              <SelectItem value="all">Todas</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-1" /> Actualizar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-400 mb-4" />
            <h3 className="font-semibold text-lg">Sin solicitudes {filter !== 'all' ? `"${filter === 'pending' ? 'pendientes' : filter === 'approved' ? 'aprobadas' : 'rechazadas'}"` : ''}</h3>
            <p className="text-muted-foreground text-sm mt-1">Todo al día.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const reasonData = (() => { try { return JSON.parse(req.reason || '{}'); } catch { return {}; } })();
            return (
            <Card key={req.id} className={req.status === 'pending' ? 'border-amber-200 bg-amber-50/30' : ''}>
              <CardContent className="pt-4 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <p className="font-semibold text-sm">{req.student_name}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CreditCard className="w-3 h-3" /> DNI: {reasonData.dni}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" /> {reasonData.celular}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" /> {req.student_email}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" /> {new Date(req.created_at).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                      {req.admin_notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">Nota: {req.admin_notes}</p>
                      )}
                    </div>
                    {statusBadge(req.status)}
                  </div>
                  {req.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white gap-1"
                        onClick={() => { setSelectedReq(req); setAction('approve'); setNotes('¡Bienvenido/a! Tus escenarios de simulación ya están disponibles.'); }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 gap-1"
                        onClick={() => { setSelectedReq(req); setAction('reject'); setNotes(''); }}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Rechazar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de confirmación */}
      <Dialog open={!!selectedReq} onOpenChange={open => !open && setSelectedReq(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {action === 'approve'
                ? <><CheckCircle2 className="w-5 h-5 text-green-600" /> Aprobar solicitud</>
                : <><XCircle className="w-5 h-5 text-red-600" /> Rechazar solicitud</>}
            </DialogTitle>
          </DialogHeader>
          {selectedReq && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3 text-sm">
                {(() => { try {
                  const rd = JSON.parse(selectedReq.reason || '{}');
                  return <>
                    <p className="font-semibold">{selectedReq.student_name}</p>
                    <p className="text-muted-foreground">{selectedReq.student_email}</p>
                    <p className="text-muted-foreground">DNI: {rd.dni} · Cel: {rd.celular}</p>
                  </>;
                } catch {
                  return <>
                    <p className="font-semibold">{selectedReq.student_name}</p>
                    <p className="text-muted-foreground">{selectedReq.student_email}</p>
                  </>;
                } })()}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Mensaje para el alumno <span className="text-muted-foreground">(opcional)</span>
                </label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Escribe un mensaje que recibirá el alumno por email..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setSelectedReq(null)}>Cancelar</Button>
                <Button
                  onClick={handleAction}
                  disabled={processing}
                  className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {processing ? 'Procesando...' : action === 'approve' ? '✅ Confirmar Aprobación' : '❌ Confirmar Rechazo'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
