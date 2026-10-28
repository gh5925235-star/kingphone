// Export an HTML element to PDF using html2pdf.js, which renders the DOM to
// canvas then to PDF — preserving Arabic shaping that plain jsPDF text breaks.

let cached: ((el: HTMLElement, opts: Record<string, unknown>) => Promise<unknown>) | null = null;

async function getLib(): Promise<
  (el: HTMLElement, opts: Record<string, unknown>) => Promise<unknown>
> {
  if (!cached) {
    const mod = await import('html2pdf.js');
    const fn = (mod as unknown as { default: unknown }).default ?? mod;
    cached = fn as (el: HTMLElement, opts: Record<string, unknown>) => Promise<unknown>;
  }
  return cached;
}

const A4_OPTS = {
  margin: 0,
  filename: 'document.pdf',
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
};

// Render the element to a PDF and trigger a browser download. Returns the File.
export async function exportElementToPdfFile(element: HTMLElement, filename: string): Promise<File> {
  const lib = await getLib();
  const opts = { ...A4_OPTS, filename: `${filename}.pdf` };
  const result = await lib(element, opts);
  // html2pdf resolves to a jsPDF/workdoc; we re-render to a blob to get a File.
  const blob = await renderToBlob(element);
  return new File([blob], `${filename}.pdf`, { type: 'application/pdf' });
}

async function renderToBlob(element: HTMLElement): Promise<Blob> {
  const lib = await getLib();
  return await new Promise<Blob>((resolve, reject) => {
    const worker = (lib as unknown as (el: HTMLElement) => {
      set: (el: HTMLElement) => unknown;
      outputPdf: (type: string, cb: (data: Blob) => void) => unknown;
    })(element);
    try {
      worker
        .outputPdf('blob', (data: Blob) => resolve(data));
    } catch (e) {
      reject(e);
    }
  });
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function shareOnWhatsApp(file: File, phoneDigits: string, message: string): Promise<boolean> {
  const nav = navigator as Navigator & {
    canShare?: (data: { files?: File[] }) => boolean;
    share?: (data: { files?: File[]; text?: string }) => Promise<void>;
  };
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], text: message });
      return true;
    } catch {
      // cancelled or failed — fall through to wa.me
    }
  }
  const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
  return false;
}
