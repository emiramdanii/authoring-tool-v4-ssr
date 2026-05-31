'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
// All icons migrated to Material Symbols Outlined
import type { SheetPreview } from './types';
import { SHEET_NAMES, SHEET_DESCRIPTIONS, SHEET_COLORS } from './constants';
import { getRowCount } from './helpers';

interface ExcelPreviewDialogProps {
  previewOpen: boolean;
  previewSheets: SheetPreview[];
  activePreviewTab: string;
  setActivePreviewTab: (tab: string) => void;
  setPreviewOpen: (open: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function ExcelPreviewDialog({
  previewOpen,
  previewSheets,
  activePreviewTab,
  setActivePreviewTab,
  setPreviewOpen,
  onClose,
  onConfirm,
}: ExcelPreviewDialogProps) {
  return (
    <Dialog open={previewOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
      setPreviewOpen(open);
    }}>
      <DialogContent className="bg-app-surface border-app-border text-app-primary sm:max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle className="text-lg font-bold text-app-primary flex items-center gap-2">
            <span className="material-symbols-outlined size-5 text-app-accent" style={ { fontSize: '16px' } }>visibility</span>
            Preview Import Excel
          </DialogTitle>
          <DialogDescription className="text-app-secondary text-sm">
            Periksa data dari setiap sheet sebelum mengimport. Data yang sudah ada akan ditimpa.
          </DialogDescription>
        </DialogHeader>

        {/* Summary badges */}
        <div className="px-6 pb-3 flex flex-wrap gap-2 flex-shrink-0">
          {SHEET_NAMES.map((name) => {
            const count = getRowCount(previewSheets, name);
            const hasData = count > 0;
            return (
              <Badge
                key={name}
                variant="outline"
                className={`
                  text-xs cursor-pointer transition-all
                  ${hasData ? SHEET_COLORS[name] : 'bg-app-elevated text-app-muted border-app-border'}
                  ${activePreviewTab === name ? 'ring-2 ring-app-accent/50' : ''}
                `}
                onClick={() => setActivePreviewTab(name)}
              >
                {name}
                <span className="ml-1 opacity-70">({count})</span>
              </Badge>
            );
          })}
        </div>

        {/* Sheet preview tabs with tables */}
        <div className="flex-1 overflow-hidden px-6 pb-4">
          <Tabs value={activePreviewTab} onValueChange={setActivePreviewTab}>
            {SHEET_NAMES.map((name) => {
              const sheet = previewSheets.find((s) => s.name === name);
              if (!sheet) return null;

              return (
                <TabsContent key={name} value={name} className="mt-0 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-app-primary">{name}</span>
                      <span className="text-xs text-app-muted">{SHEET_DESCRIPTIONS[name]}</span>
                    </div>
                    <span className="text-xs text-app-muted">
                      {sheet.rows.filter((r) => r.some((c) => c.trim() !== '')).length} baris data
                    </span>
                  </div>

                  <ScrollArea className="flex-1 rounded-lg border border-app-border max-h-[45vh]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-app-border hover:bg-transparent">
                          {sheet.headers.map((h, i) => (
                            <TableHead
                              key={i}
                              className="bg-app-elevated/80 text-app-secondary text-xs font-semibold py-2 px-3 whitespace-nowrap"
                            >
                              {h}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sheet.rows.filter((r) => r.some((c) => c.trim() !== '')).length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={sheet.headers.length}
                              className="text-center text-app-muted py-8"
                            >
                              Tidak ada data
                            </TableCell>
                          </TableRow>
                        ) : (
                          sheet.rows
                            .filter((r) => r.some((c) => c.trim() !== ''))
                            .map((row, ri) => (
                              <TableRow key={ri} className="border-app-border/50">
                                {sheet.headers.map((_, ci) => (
                                  <TableCell
                                    key={ci}
                                    className="text-xs text-app-secondary py-1.5 px-3 max-w-[200px] truncate"
                                    title={row[ci] ?? ''}
                                  >
                                    {row[ci] ?? ''}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>

        {/* Warning + Actions */}
        <DialogFooter className="p-6 pt-3 border-t border-app-border flex-shrink-0 gap-3">
          <div className="flex items-center gap-2 text-xs text-app-accent/80 mr-auto">
            <span className="material-symbols-outlined size-3.5 flex-shrink-0" style={ { fontSize: '16px' } }>warning</span>
            <span>Data yang sudah ada di editor akan ditimpa.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-app-secondary hover:text-app-primary bg-app-elevated hover:bg-app-elevated rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-sm font-semibold bg-app-accent hover:bg-app-accent/90 text-app-inverse rounded-lg transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined size-4" style={ { fontSize: '16px' } }>check_circle</span>
            Konfirmasi Import
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
