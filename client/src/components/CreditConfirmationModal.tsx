import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Coins, CheckCircle, XCircle } from 'lucide-react';

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
  const hasEnoughCredits = userCurrentCredits >= totalCredits;
  const remainingCredits = userCurrentCredits - totalCredits;

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
                Tín dụng hiện tại
              </span>
              <Badge variant="outline" className="font-mono">
                {userCurrentCredits} credits
              </Badge>
            </div>
          </div>

          {/* Credit Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Chi tiết tín dụng sử dụng:
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
                  {item.credits} credits
                </Badge>
              </div>
            ))}
            
            <Separator className="my-2" />
            
            {/* Total */}
            <div className="flex items-center justify-between py-2 bg-slate-50 dark:bg-slate-800 px-3 rounded-lg">
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Tổng cộng
              </span>
              <Badge 
                variant={hasEnoughCredits ? 'default' : 'destructive'}
                className="font-mono text-base px-3 py-1"
              >
                {totalCredits} credits
              </Badge>
            </div>
          </div>

          {/* Status Message */}
          {hasEnoughCredits ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <div className="text-sm">
                <div className="font-medium text-green-800 dark:text-green-300">
                  Đủ tín dụng để thực hiện
                </div>
                <div className="text-green-600 dark:text-green-400">
                  Còn lại: {remainingCredits} credits sau khi thực hiện
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <div className="text-sm">
                <div className="font-medium text-red-800 dark:text-red-300">
                  Không đủ tín dùng
                </div>
                <div className="text-red-600 dark:text-red-400">
                  Thiếu: {Math.abs(remainingCredits)} credits
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
            Hủy bỏ
          </Button>
          
          <Button
            onClick={onConfirm}
            disabled={!hasEnoughCredits || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Đang xử lý...
              </div>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Xác nhận thực hiện
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}