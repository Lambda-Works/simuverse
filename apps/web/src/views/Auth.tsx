'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/ApiClient';
import { authChangeEvent } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Shield, GraduationCap, Eye, EyeOff, Bot } from 'lucide-react';

const Auth = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Visibilidad de contraseña (independiente para login y signup)
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [showSignupPwd, setShowSignupPwd] = useState(false);

  // Verificación anti-robot (solo para login)
  const [robotChecked, setRobotChecked] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!robotChecked) {
      toast.error('Por favor confirmá que no sos un robot');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, user, refreshToken } = response.data;
      
      console.log('✅ Login Response:', { token, user });
      
      // Guardar token, refreshToken y usuario en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      
      console.log('✅ localStorage saved:', {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user')
      });
      
      // Disparar evento custom para notificar al AuthProvider
      authChangeEvent.dispatchEvent(new Event('authChange'));
      
      toast.success('Sesión iniciada exitosamente');
      
      // Esperar un bit para que el contexto se actualice
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al iniciar sesión');
      // Resetear robot check tras un error para volver a confirmar
      setRobotChecked(false);
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Por favor ingrese su nombre completo');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/register', {
        email,
        password,
        name: fullName,
      });
      const { token, user, refreshToken } = response.data;
      
      // Guardar token, refreshToken y usuario en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      
      // Disparar evento custom para notificar al AuthProvider
      authChangeEvent.dispatchEvent(new Event('authChange'));
      
      toast.success('Cuenta creada exitosamente');
      
      // Esperar un poco para que el contexto se actualice
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear cuenta');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">MSM</h1>
          <p className="text-muted-foreground mt-1">Motor de Simulación Modular</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-xl">Acceder al Sistema</CardTitle>
            <CardDescription>Ingrese sus credenciales para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="signup">Registrarse</TabsTrigger>
              </TabsList>

              {/* ── LOGIN ──────────────────────────────────────────────────── */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="alumno@ejemplo.com"
                    />
                  </div>

                  {/* Campo contraseña con ojo */}
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPwd ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowLoginPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                        aria-label={showLoginPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Verificación anti-robot */}
                  <div className="flex items-center gap-3 rounded-lg border border-input bg-muted/40 px-4 py-3">
                    <Checkbox
                      id="robot-check"
                      checked={robotChecked}
                      onCheckedChange={v => setRobotChecked(!!v)}
                    />
                    <label
                      htmlFor="robot-check"
                      className="flex items-center gap-2 text-sm cursor-pointer select-none"
                    >
                      <Bot className="w-4 h-4 text-muted-foreground" />
                      No soy un robot
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || !robotChecked}
                  >
                    {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                  </Button>
                </form>
              </TabsContent>

              {/* ── REGISTRO ───────────────────────────────────────────────── */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nombre Completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="alumno@ejemplo.com"
                    />
                  </div>

                  {/* Campo contraseña con ojo */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPwd ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowSignupPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                        aria-label={showSignupPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showSignupPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    <GraduationCap className="w-4 h-4 mr-2" />
                    {loading ? 'Registrando...' : 'Crear Cuenta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;