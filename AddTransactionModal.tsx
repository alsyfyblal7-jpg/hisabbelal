import React, { useState, useRef } from 'react';
import { X, Check, Banknote, FileText, Info, Camera, Image } from 'lucide-react';
import { Transaction } from '../types';
import { getCurrencySymbol } from '../storage';

interface AddTransactionModalProps {
  type: 'debt' | 'payment';
  currency: string;
  onClose: () => void;
  onAdd: (description: string, amount: number, attachment?: string | null, attachmentName?: string) => void;
}

export default function AddTransactionModal({ type, currency, onClose, onAdd }: AddTransactionModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('حجم الملف كبير جداً. الحد الأقصى هو 2 ميجابايت.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment(reader.result as string);
        setAttachmentName(file.name);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('الرجاء إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }
    
    onAdd(description.trim() || (type === 'debt' ? 'مشتريات' : 'دفعة نقدية'), amountNum, attachment, attachmentName);
  };

  const isDebt = type === 'debt';
  const themeColor = isDebt ? '#f43f5e' : '#4ade80'; // soft red vs soft emerald
  const themeBgLight = isDebt ? 'rgba(244,63,94,0.1)' : 'rgba(74,222,128,0.1)';
  const themeBorder = isDebt ? 'rgba(244,63,94,0.2)' : 'rgba(74,222,128,0.2)';

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-[fadeIn_0.3s_ease]" dir="rtl">
      <div className="bg-white dark:bg-[#0b1c30] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col transform transition-transform duration-300 animate-[scaleIn_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)] transition-colors duration-300">
        
        {/* Modal Header */}
        <div className="p-6 pb-2 flex justify-between items-start border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: themeBgLight, color: themeColor }}
            >
              <FileText size={28} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white font-headline-md font-sans">
                {isDebt ? 'تسجيل دين جديد' : 'تسجيل سداد جديد'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#bccac0]">
                {isDebt ? 'إضافة معاملة ذمة جديدة للعميل' : 'تسجيل دفعة نقدية جديدة مستلمة'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-[#bccac0] active:scale-95 transition-transform"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-6">
          
          {/* Amount Input */}
          <div className="relative">
            <label className="text-xs font-semibold text-slate-600 dark:text-[#bccac0] mb-2 block">المبلغ المستحق</label>
            <div 
              className="rounded-2xl p-4 flex items-center gap-4 border transition-all bg-slate-50 dark:bg-[#111c2d] focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#68dba9] focus-within:ring-offset-[#0b1c30]"
              style={{ borderColor: themeBorder }}
            >
              <Banknote size={24} style={{ color: themeColor }} />
              <div className="flex-1">
                <input
                  autoFocus
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError('');
                  }}
                  placeholder="0.00"
                  className="w-full bg-transparent border-none focus:outline-none text-2xl font-bold p-0 placeholder-slate-400 dark:placeholder-gray-500 font-mono text-slate-800 dark:text-white"
                  style={{ color: amount ? themeColor : undefined }}
                />
              </div>
              <span className="font-bold text-slate-500 dark:text-[#bccac0] text-sm">{getCurrencySymbol(currency)}</span>
            </div>
          </div>

          {/* Description Input */}
          <div className="relative">
            <label className="text-xs font-semibold text-slate-600 dark:text-[#bccac0] mb-2 block">وصف المعاملة</label>
            <div className="bg-slate-50 dark:bg-[#111c2d] rounded-2xl p-4 border border-slate-200 dark:border-[#3d4a42]/30 focus-within:ring-2 focus-within:ring-[#68dba9]/30 transition-all flex items-start gap-3">
              <FileText size={20} className="text-slate-400 dark:text-[#bccac0]/60 mt-0.5" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isDebt ? "مشتريات" : "دفعة نقدية"}
                rows={2}
                className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 resize-none p-0"
              />
            </div>
          </div>

          {/* Attachment upload (Only for Payments) */}
          {!isDebt && (
            <div className="relative">
              <label className="text-xs font-semibold text-slate-600 dark:text-[#bccac0] mb-2 block">إرفاق إيصال / مستند (اختياري)</label>
              
              {attachment ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-[#3d4a42]/50 bg-slate-50 dark:bg-[#111c2d] p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center">
                      {attachment.startsWith('data:image/') ? (
                        <img src={attachment} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <FileText size={24} className="text-[#68dba9]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-800 dark:text-white font-mono truncate max-w-[180px]">{attachmentName}</p>
                      <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold font-sans">تم الرفع بنجاح ✓</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="p-1.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/35 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-[#3d4a42] bg-slate-50/50 dark:bg-[#111c2d]/40 flex flex-col items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-[#bccac0] hover:bg-slate-100 dark:hover:bg-[#111c2d]/70 active:scale-[0.99] transition-all shadow-inner"
                >
                  <Camera size={20} className="text-[#00855d] dark:text-[#68dba9]" />
                  <span className="font-semibold">رفع صورة العيينة المحاسبية أو الإيصال</span>
                  <span className="text-[10px] text-slate-400 dark:text-[#bccac0]/50 font-mono">(الحد الأقصى: 2 ميجابايت)</span>
                </button>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="hidden"
              />
            </div>
          )}

          {/* Visual Alert Info Box */}
          <div 
            className="flex items-start gap-3 p-4 rounded-xl border"
            style={{ 
              backgroundColor: isDebt ? 'rgba(244,63,94,0.05)' : 'rgba(74,222,128,0.05)', 
              borderColor: isDebt ? 'rgba(244,63,94,0.15)' : 'rgba(74,222,128,0.15)'
            }}
          >
            <Info size={18} style={{ color: themeColor }} className="mt-0.5" />
            <p className="text-xs shrink-0 leading-relaxed text-slate-600 dark:text-[#bccac0]">
              سيتم إضافة هذا المبلغ كـ <strong style={{ color: themeColor }}>{isDebt ? 'دين مستحق' : 'دفعة سداد'}</strong> على رصيد العميل الحالي فور الحفظ.
            </p>
          </div>

          {/* Error display */}
          {error && (
            <p className="text-rose-400 text-xs text-center border border-rose-500/10 bg-rose-500/5 p-2 rounded-lg">{error}</p>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-3 text-white font-bold transition-all shadow-lg active:scale-[0.98] animate-[pulse-glow_2s_infinite]"
            style={{ 
              backgroundColor: themeColor, 
              boxShadow: `0 8px 24px ${isDebt ? 'rgba(244,63,94,0.25)' : 'rgba(74,222,128,0.25)'}`
            }}
          >
            <Check size={20} className="font-bold" />
            <span className="font-headline-md text-sm">{isDebt ? 'تسجيل الدين' : 'تسجيل السداد'}</span>
          </button>
        </form>

        {/* Modal Decorative Line */}
        <div 
          className="h-1.5 w-full bg-gradient-to-r"
          style={{ 
            backgroundImage: `linear-gradient(to right, transparent, ${themeColor}, transparent)` 
          }}
        />
      </div>
    </div>
  );
}
