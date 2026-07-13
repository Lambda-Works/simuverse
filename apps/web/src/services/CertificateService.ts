/**
 * CertificateService - Student Certificate Generation
 * Generates PDF certificates with QR codes and competency radar charts
 * Uses html2pdf and chart.js for visualization
 */

interface StudentData {
  id: number;
  name: string;
  email: string;
  simulationId: number;
  courseId: number;
  courseName: string;
  familyType: string;
  completionDate: string;
  score: number;
  completionTime: number; // in minutes
  competencies: {
    name: string;
    score: number; // 0-100
  }[];
  actions: {
    type: string;
    count: number;
  }[];
}

interface CertificateConfig {
  issuerName?: string;
  issuerLogo?: string;
  companyName?: string;
  signatureDataUrl?: string;
  theme?: 'light' | 'dark' | 'professional' | 'modern';
}

/**
 * CertificateService - Main class for certificate generation
 */
class CertificateService {
  private config: CertificateConfig;
  private canvasWidth = 1200;
  private canvasHeight = 850;

  constructor(config: CertificateConfig = {}) {
    this.config = {
      issuerName: config.issuerName || 'FEPEI 360',
      issuerLogo: config.issuerLogo || '',
      companyName: config.companyName || 'Simulador Empresarial',
      signatureDataUrl: config.signatureDataUrl || '',
      theme: config.theme || 'professional',
    };
  }

  /**
   * Generate complete certificate as PDF
   */
  async generateCertificate(studentData: StudentData): Promise<Blob> {
    try {
      // Create canvas for certificate
      const canvas = document.createElement('canvas');
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;
      const ctx = canvas.getContext('2d')!;

      // Draw certificate background
      this.drawCertificateBackground(ctx, studentData);

      // Draw header
      this.drawHeader(ctx, studentData);

      // Draw main content
      this.drawMainContent(ctx, studentData);

      // Draw competencies radar chart
      const radarCanvas = await this.generateRadarChart(studentData.competencies);
      const radarImage = radarCanvas.toDataURL('image/png');
      ctx.drawImage(radarCanvas, 750, 300, 400, 400);

      // Draw QR code
      const qrCode = await this.generateQRCode(studentData.simulationId);
      ctx.drawImage(qrCode, 50, 600, 150, 150);

      // Draw footer
      this.drawFooter(ctx, studentData);

      // Convert canvas to blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob || new Blob());
        }, 'image/png');
      });
    } catch (error) {
      console.error('Error generating certificate:', error);
      throw new Error('Failed to generate certificate');
    }
  }

  /**
   * Draw certificate background with theme styling
   */
  private drawCertificateBackground(ctx: CanvasRenderingContext2D, data: StudentData): void {
    const theme = this.config.theme;

    // Background colors
    const colors: Record<string, { bg: string; accent: string; text: string }> = {
      professional: { bg: '#ffffff', accent: '#1e40af', text: '#1f2937' },
      modern: { bg: '#f8fafc', accent: '#7c3aed', text: '#0f172a' },
      light: { bg: '#fafafa', accent: '#2563eb', text: '#374151' },
      dark: { bg: '#1f2937', accent: '#60a5fa', text: '#f3f4f6' },
    };

    const selectedTheme = (theme && colors[theme]) ? colors[theme] : colors.professional;

    // Draw background
    ctx.fillStyle = selectedTheme.bg;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Draw decorative border
    ctx.strokeStyle = selectedTheme.accent;
    ctx.lineWidth = 8;
    ctx.strokeRect(30, 30, this.canvasWidth - 60, this.canvasHeight - 60);

    // Draw accent line
    ctx.fillStyle = selectedTheme.accent;
    ctx.fillRect(30, 50, this.canvasWidth - 60, 4);

    // Store theme colors for other methods
    (ctx as any).__theme = selectedTheme;
  }

  /**
   * Draw certificate header with issuer info
   */
  private drawHeader(ctx: CanvasRenderingContext2D, data: StudentData): void {
    const theme = (ctx as any).__theme || {
      bg: '#ffffff',
      accent: '#1e40af',
      text: '#1f2937',
    };

    // Issuer name
    ctx.fillStyle = theme.accent;
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.config.issuerName || 'FEPEI 360', this.canvasWidth / 2, 100);

    // Certificate title
    ctx.fillStyle = theme.text;
    ctx.font = 'bold 48px Arial';
    ctx.fillText('CERTIFICADO DE COMPETENCIA', this.canvasWidth / 2, 160);

    // Subtitle
    ctx.fillStyle = '#666';
    ctx.font = '18px Arial';
    ctx.fillText('Simulación Empresarial', this.canvasWidth / 2, 200);
  }

  /**
   * Draw main certificate content
   */
  private drawMainContent(
    ctx: CanvasRenderingContext2D,
    data: StudentData
  ): void {
    const theme = (ctx as any).__theme || { text: '#1f2937' };
    const lineHeight = 40;
    let y = 250;

    ctx.fillStyle = theme.text;
    ctx.font = 'italic 18px Georgia';
    ctx.textAlign = 'center';

    // Main text
    ctx.fillText('Se certifica que', this.canvasWidth / 2, y);
    y += lineHeight;

    // Student name
    ctx.font = 'bold 28px Arial';
    ctx.fillText(data.name, this.canvasWidth / 2, y);
    y += lineHeight * 1.5;

    // Achievement text
    ctx.font = 'italic 16px Georgia';
    ctx.fillText(
      `ha completado exitosamente la simulación empresarial de ${data.familyType}`,
      this.canvasWidth / 2,
      y
    );
    y += lineHeight;

    ctx.fillText(
      `con un desempeño de ${data.score}% y tiempo de ${Math.round(data.completionTime)} minutos`,
      this.canvasWidth / 2,
      y
    );
    y += lineHeight * 1.5;

    // Details
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Curso: ${data.courseName}`, 100, y);
    y += lineHeight;
    ctx.fillText(`Fecha: ${new Date(data.completionDate).toLocaleDateString('es-ES')}`, 100, y);
    y += lineHeight;
    ctx.fillText(`ID Simulación: ${data.simulationId}`, 100, y);
  }

  /**
   * Generate radar chart for competencies
   */
  private async generateRadarChart(competencies: Array<{ name: string; score: number }>): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;

    // Draw radar chart manually (without external library)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = 150;
    const levels = 5;
    const angleSlice = (Math.PI * 2) / competencies.length;

    // Draw concentric circles
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    for (let i = 1; i <= levels; i++) {
      const radius = (maxRadius / levels) * i;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#999';
    for (let i = 0; i < competencies.length; i++) {
      const angle = angleSlice * i - Math.PI / 2;
      const x = centerX + maxRadius * Math.cos(angle);
      const y = centerY + maxRadius * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Draw competency polygon
    ctx.fillStyle = 'rgba(124, 58, 237, 0.3)';
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.beginPath();

    competencies.forEach((comp, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const radius = (maxRadius * comp.score) / 100;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    competencies.forEach((comp, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const labelRadius = maxRadius + 30;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      ctx.fillText(comp.name.substring(0, 10), x, y);
      ctx.fillText(`${comp.score}%`, x, y + 15);
    });

    return canvas;
  }

  /**
   * Generate QR code
   */
  private async generateQRCode(simulationId: number): Promise<HTMLCanvasElement> {
    // For now, create a simple QR-like placeholder
    // In production, use qrcode.js library
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;

    // Draw QR-like pattern
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200);

    // Draw timing patterns
    ctx.fillStyle = '#000000';

    // Top-left finder pattern
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
          ctx.fillRect(i * 20, j * 20, 20, 20);
        }
      }
    }

    // Data area with simulation ID
    ctx.fillStyle = '#666';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`ID: ${simulationId}`, 100, 180);

    return canvas;
  }

  /**
   * Draw certificate footer with signature and date
   */
  private drawFooter(ctx: CanvasRenderingContext2D, data: StudentData): void {
    const theme = (ctx as any).__theme || { text: '#1f2937' };

    ctx.fillStyle = theme.text;
    ctx.font = '12px Arial';

    // Left side: Signature line
    ctx.textAlign = 'left';
    ctx.fillText('_________________', 100, 780);
    ctx.font = '11px Arial';
    ctx.fillText('Firma Autorizado', 100, 810);

    // Center: Date
    ctx.textAlign = 'center';
    const today = new Date().toLocaleDateString('es-ES');
    ctx.fillText(`Fecha: ${today}`, this.canvasWidth / 2, 810);

    // Right side: Verification code
    ctx.textAlign = 'right';
    ctx.font = '11px monospace';
    const verificationCode = `VER-${data.simulationId}-${Date.now().toString(36).toUpperCase()}`;
    ctx.fillText(verificationCode, this.canvasWidth - 100, 810);

    // Bottom disclaimer
    ctx.fillStyle = '#999';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      'Este certificado verifica que el participante completó la simulación empresarial',
      this.canvasWidth / 2,
      this.canvasHeight - 20
    );
  }

  /**
   * Download certificate as PNG
   */
  async downloadCertificate(studentData: StudentData, filename?: string): Promise<void> {
    try {
      const blob = await this.generateCertificate(studentData);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `certificado_${studentData.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      throw error;
    }
  }

  /**
   * Email certificate
   */
  async emailCertificate(studentData: StudentData, recipientEmail: string): Promise<boolean> {
    try {
      const blob = await this.generateCertificate(studentData);

      // Create form data
      const formData = new FormData();
      formData.append('email', recipientEmail);
      formData.append('name', studentData.name);
      formData.append('course', studentData.courseName);
      formData.append('certificate', blob, 'certificate.png');

      // Send to backend
      const response = await fetch('/api/certificates/send-email', {
        method: 'POST',
        body: formData,
      });

      return response.ok;
    } catch (error) {
      console.error('Error emailing certificate:', error);
      return false;
    }
  }

  /**
   * Get certificate preview as data URL
   */
  async getPreviewDataUrl(studentData: StudentData): Promise<string> {
    try {
      const blob = await this.generateCertificate(studentData);
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error generating preview:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const certificateService = new CertificateService({
  issuerName: 'FEPEI 360',
  companyName: 'Sistema de Simulación Empresarial',
  theme: 'professional',
});

export default CertificateService;
