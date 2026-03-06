
-- ============================================
-- MSM (Motor de Simulación Modular) Schema
-- ============================================

-- Roles enum
CREATE TYPE public.app_role AS ENUM ('alumno', 'profesor', 'administrador', 'ministerio');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Courses table (config-driven)
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  modules JSONB NOT NULL DEFAULT '[]',
  ai_config JSONB NOT NULL DEFAULT '{}',
  eval_criteria JSONB NOT NULL DEFAULT '[]',
  crisis_events JSONB NOT NULL DEFAULT '[]',
  documents JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Simulations table (student sessions)
CREATE TABLE public.simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  score NUMERIC,
  ai_assessment JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'
);
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

-- Telemetry logs (append-only audit trail)
CREATE TABLE public.simulation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.simulation_logs ENABLE ROW LEVEL SECURITY;

-- Chat messages within simulations
CREATE TABLE public.simulation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.simulation_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- User roles: users see their own, admins see all
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'administrador'));

-- Profiles
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Courses: everyone can read active, admins can manage
CREATE POLICY "Active courses viewable by authenticated" ON public.courses
  FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(), 'administrador'));
CREATE POLICY "Admins can insert courses" ON public.courses
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'administrador'));
CREATE POLICY "Admins can update courses" ON public.courses
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'administrador'));
CREATE POLICY "Admins can delete courses" ON public.courses
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'administrador'));

-- Simulations: students see their own, teachers/admins see all
CREATE POLICY "Users can view own simulations" ON public.simulations
  FOR SELECT USING (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'profesor') 
    OR public.has_role(auth.uid(), 'administrador')
    OR public.has_role(auth.uid(), 'ministerio')
  );
CREATE POLICY "Users can create simulations" ON public.simulations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own simulations" ON public.simulations
  FOR UPDATE USING (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'profesor')
    OR public.has_role(auth.uid(), 'administrador')
  );

-- Simulation logs: same as simulations
CREATE POLICY "View logs" ON public.simulation_logs
  FOR SELECT USING (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'profesor')
    OR public.has_role(auth.uid(), 'administrador')
    OR public.has_role(auth.uid(), 'ministerio')
  );
CREATE POLICY "Insert own logs" ON public.simulation_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messages
CREATE POLICY "View own messages" ON public.simulation_messages
  FOR SELECT USING (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'profesor')
    OR public.has_role(auth.uid(), 'administrador')
  );
CREATE POLICY "Insert own messages" ON public.simulation_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Triggers
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  -- Default role: alumno
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'alumno');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes
CREATE INDEX idx_simulations_user ON public.simulations(user_id);
CREATE INDEX idx_simulations_course ON public.simulations(course_id);
CREATE INDEX idx_simulation_logs_sim ON public.simulation_logs(simulation_id);
CREATE INDEX idx_simulation_messages_sim ON public.simulation_messages(simulation_id);
CREATE INDEX idx_courses_course_id ON public.courses(course_id);
