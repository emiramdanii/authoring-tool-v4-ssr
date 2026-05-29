'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Smartphone, Upload, Share2, ExternalLink } from 'lucide-react';

interface ExportSuccessDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ExportSuccessDialog({ open, onClose }: ExportSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-app-surface border-app-border">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-400" style={ { fontSize: '20px' } }>check_circle</span>
            </div>
            <div>
              <DialogTitle className="text-emerald-400 text-base">Export Berhasil!</DialogTitle>
              <DialogDescription className="text-app-muted text-xs">
                File HTML sudah diunduh
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* How to share section */}
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-app-primary">Cara membagikan ke siswa:</p>

          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-emerald-400" style={ { fontSize: '12px' } }>upload</span>
              </div>
              <div>
                <p className="text-xs text-app-secondary">Upload file HTML ke Google Drive / hosting</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-emerald-400" style={ { fontSize: '12px' } }>share</span>
              </div>
              <div>
                <p className="text-xs text-app-secondary">Bagikan link ke siswa via WhatsApp / Google Classroom</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-emerald-400" style={ { fontSize: '12px' } }>smartphone</span>
              </div>
              <div>
                <p className="text-xs text-app-secondary">Siswa buka link di HP — langsung jalan!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="flex items-start gap-2 text-xs text-app-muted bg-app-elevated/50 rounded-lg p-3">
          <span className="material-symbols-outlined text-emerald-400/60 flex-shrink-0 mt-0.5" style={ { fontSize: '12px' } }>open_in_new</span>
          <span>File HTML ini sudah termasuk semua konten. Tidak perlu instalasi — cukup buka di browser.</span>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs"
          >
            Tutup
          </Button>
          <Button
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>check_circle</span>
            Selesai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
