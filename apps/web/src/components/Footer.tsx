'use client'
import { useEffect, useState } from 'react';
import { SponsorCarousel, SponsorItem } from '@/components/SponsorCarousel';
import { apiClient } from '@/services/ApiClient';
import { Code2 } from 'lucide-react';

interface FooterProps {
  sponsors?: SponsorItem[];
  courseId?: string;
  className?: string;
}

export function Footer({ sponsors: initialSponsors, courseId, className = '' }: FooterProps) {
  const [sponsors, setSponsors] = useState<SponsorItem[]>(initialSponsors || []);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (initialSponsors) {
      setSponsors(initialSponsors);
      return;
    }

    let isMounted = true;
    const fetchSponsors = async () => {
      try {
        const endpoint = courseId ? `/courses/${courseId}/sponsors` : '/sponsors';
        const res = await apiClient.get(endpoint);
        const data = Array.isArray(res.data) ? res.data : [];
        if (isMounted) {
          setSponsors(data.filter((s: any) => s && s.is_active !== false));
        }
      } catch {
        if (isMounted) setSponsors([]);
      }
    };

    fetchSponsors();
    return () => {
      isMounted = false;
    };
  }, [courseId, initialSponsors]);

  return (
    <footer className={`w-full bg-slate-900 text-slate-300 border-t border-slate-800 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Sponsors Carousel */}
        {sponsors.length > 0 && (
          <div className="border-b border-slate-800 pb-6">
            <SponsorCarousel sponsors={sponsors} title="Sponsors y Aliados" />
          </div>
        )}

        {/* LambdaWorks Footer Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            {!imgError ? (
              <img
                src="/lambda-icon.png"
                alt="LambdaWorks"
                className="w-5 h-5 object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-5 h-5 rounded bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                λ
              </div>
            )}
            <span className="font-medium text-slate-300">
              Desarrollado por <span className="font-semibold text-indigo-400">LambdaWorks</span>
            </span>
          </div>

          <p>© {new Date().getFullYear()} Simuverse Engine. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
