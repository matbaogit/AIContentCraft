import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Coins, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useDbTranslations } from '@/hooks/use-db-translations';

interface CreditBreakdown {
  label: string;
  credits: number;
  color?: 'default' | 'secondary' | 'destructive' | 'outline';
}

interface CreditConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  breakdown: CreditBreakdown[];
  totalCredits: number;
  userCurrentCredits: number;
  isLoading?: boolean;
}

export function CreditConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  breakdown,
  totalCredits,
  userCurrentCredits,
  isLoading = false
}: CreditConfirmationModalProps) {
  const { language } = useLanguage();
  const { t: dbT } = useDbTranslations();
  const hasEnoughCredits = userCurrentCredits >= totalCredits;
  const remainingCredits = userCurrentCredits - totalCredits;

  // Translation helper function with fallbacks
  const t = (key: string, fallbackVi: string, fallbackEn: string) => {
    // Try database translations first
    const dbTranslation = dbT(key);
    if (dbTranslation && dbTranslation !== key) {
      return dbTranslation;
    }
    // Fallback to hardcoded translations
    return language === 'vi' ? fallbackVi : fallbackEn;
  };

  // Dynamic translations
  const creditWord = t('credit.unit', 'tín dụng', 'credits');
  const currentCreditsLabel = t('credit.current', 'Tín dụng hiện tại', 'Current Credits');
  const detailLabel = t('credit.detail', 'Chi tiết tín dụng sử dụng:', 'Credit Usage Details:');
  const totalLabel = t('credit.total', 'Tổng cộng', 'Total');
  const sufficientMessage = t('credit.sufficient', 'Đủ tín dụng để thực hiện', 'Sufficient credits to proceed');
  const insufficientMessage = t('credit.insufficient', 'Không đủ tín dụng', 'Insufficient credits');
  const remainingMessage = t('credit.remaining', 'Còn lại:', 'Remaining:');
  const neededMessage = t('credit.needed', 'Thiếu:', 'Needed:');
  const afterExecutionMessage = t('credit.afterExecution', 'sau khi thực hiện', 'after execution');
  const cancelLabel = t('common.cancel', 'Hủy bỏ', 'Cancel');
  const confirmLabel = t('credit.confirm', 'Xác nhận thực hiện', 'Confirm Execution');
  const processingLabel = t('common.processing', 'Đang xử lý...', 'Processing...');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Credits */}
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {currentCreditsLabel}
              </span>
              <Badge variant="outline" className="font-mono">
                {userCurrentCredits} {creditWord}
              </Badge>
            </div>
          </div>

          {/* Credit Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {detailLabel}
            </h4>
            
            {breakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {item.label}
                </span>
                <Badge 
                  variant={item.color || 'secondary'}
                  className="font-mono"
                >
                  {item.credits} {creditWord}
                </Badge>
              </div>
            ))}
            
            <Separator className="my-2" />
            
            {/* Total */}
            <div className="flex items-center justify-between py-2 bg-slate-50 dark:bg-slate-800 px-3 rounded-lg">
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {totalLabel}
              </span>
              <Badge 
                variant={hasEnoughCredits ? 'default' : 'destructive'}
                className="font-mono text-base px-3 py-1"
              >
                {totalCredits} {creditWord}
              </Badge>
            </div>
          </div>

          {/* Status Message */}
          {hasEnoughCredits ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <div className="text-sm">
                <div className="font-medium text-green-800 dark:text-green-300">
                  {sufficientMessage}
                </div>
                <div className="text-green-600 dark:text-green-400">
                  {remainingMessage} {remainingCredits} {creditWord} {afterExecutionMessage}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <div className="text-sm">
                <div className="font-medium text-red-800 dark:text-red-300">
                  {insufficientMessage}
                </div>
                <div className="text-red-600 dark:text-red-400">
                  {neededMessage} {Math.abs(remainingCredits)} {creditWord}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-2" />
            {cancelLabel}
          </Button>
          
          <Button
            onClick={onConfirm}
            disabled={!hasEnoughCredits || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                {processingLabel}
              </div>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {confirmLabel}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}