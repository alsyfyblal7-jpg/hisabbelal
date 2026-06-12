import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  FileDown, 
  Printer, 
  Mail, 
  Share2, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Phone, 
  Calendar,
  Lock,
  Store
} from 'lucide-react';
import { Customer, StoreSettings } from '../types';
import { 
  getCustomerBalance, 
  formatCurrency, 
  formatDate, 
  formatTime, 
  getCurrencySymbol, 
  getCurrencyName 
} from '../storage';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

interface StatementPreviewModalProps {
  customer: Customer;
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
}

export default function StatementPreviewModal({
  customer,
  settings,
  isOpen,
  onClose
}: StatementPreviewModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const totalOwed = getCustomerBalance(customer);

  if (!isOpen) return null;

  // Compute chronologically sorted transactions for standard accounting ledger flow (oldest starting)
  const chronologicalTransactions = [...customer.transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculates running cumulative balance row-by-row
  let rollingBalance = 0;
  const ledgerRows = chronologicalTransactions.map(tx => {
    if (tx.type === 'debt') {
      rollingBalance += tx.amount;
    } else {
      rollingBalance -= tx.amount;
    }
    return {
      ...tx,
      currentBalance: rollingBalance
    };
  });

  // Computes statistics specifically for statement
  const totalDebtsAdded = customer.transactions
    .filter(t => t.type === 'debt')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaymentsMade = customer.transactions
    .filter(t => t.type === 'payment')
    .reduce((sum, t) => sum + t.amount, 0);

  // Handle PDF Export
  const handleDownloadPDF = async () => {
    const element = printAreaRef.current;
    if (!element) return;

    setIsDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          transform: 'none',
          boxShadow: 'none'
        }
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const canvasWidth = imgProps.width;
      const canvasHeight = imgProps.height;

      // Adjust to fit single-page or multi-page formats gracefully
      const imgHeightOnPdf = (canvasHeight * pdfWidth) / canvasWidth;
      
      let heightLeft = imgHeightOnPdf;
      let position = 0;

      // Fit elements nicely on standard page boundaries
      pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeightOnPdf);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeightOnPdf;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeightOnPdf);
        heightLeft -= pdfHeight;
      }

      pdf.save(`كشف_حساب_محاسبي_${customer.name}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('حدث خطأ أثناء تصدير ملف كشف الحساب. يرجى المحاولة مجدداً.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.3s_ease]" dir="rtl">
      
      {/* Outer Modal container */}
      <div className="bg-white dark:bg-[#0b1c30] w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 dark:border-white/10 transition-colors duration-300">
        
        {/* Modal Header actions */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-[#00855d] dark:text-[#68dba9]" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-white font-headline-md">معاينة وتنزيل كشف الحساب</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-[#bccac0] active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content containing preview */}
        <div className="flex-1 p-4 overflow-auto bg-slate-100 dark:bg-[#071321] transition-colors duration-300">
          
          <div className="mx-auto" style={{ width: '800px' }}>
            {/* Printable Statement Area */}
            <div 
              ref={printAreaRef}
              id="print-statement-pane"
              className="w-full relative shadow-sm"
              style={{ 
                fontFamily: 'system-ui, -apple-system, sans-serif',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                padding: '40px'
              }}
            >
              <div 
                className="absolute inset-0 z-0 opacity-[0.02]" 
                style={{ 
                  backgroundImage: settings.logo ? `url(${settings.logo})` : 'none', 
                  backgroundPosition: 'center', 
                  backgroundSize: '80%', 
                  backgroundRepeat: 'no-repeat' 
                }}
              />

              <div className="relative z-10 w-full">
                {/* 1. Horizontal Header: Store (Right) & Customer (Left) */}
                <div className="flex justify-between items-start border-b-2 pb-6 mb-6" style={{ borderColor: 'rgba(0, 105, 72, 0.2)' }}>
                  
                  {/* Store Details */}
                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: settings.logo ? 'transparent' : '#00855d', color: '#ffffff' }}>
                      {settings.logo ? (
                        <img src={settings.logo} alt="Store Logo" className="w-full h-full object-cover" crossOrigin="anonymous" />
                      ) : (
                        <Store size={40} />
                      )}
                    </div>
                    <div>
                      <h1 className="text-3xl font-black" style={{ color: '#006948' }}>{settings.name}</h1>
                      <div className="mt-1 flex gap-3 text-xs font-bold" style={{ color: '#64748b' }}>
                        <span>كشف حساب تفصيلي</span>
                        {settings.storePhone && <span>• 📞 {settings.storePhone}</span>}
                      </div>
                      <div className="flex gap-3 mt-1 text-[10px]" style={{ color: '#94a3b8' }}>
                         <span>استخراج: {new Date().toLocaleDateString('ar-YE')}</span>
                         <span>وقت: {new Date().toLocaleTimeString('ar-YE', {hour12:true, hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Details Box */}
                  <div className="p-4 rounded-xl min-w-[280px]" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div className="flex justify-between items-start mb-2">
                       <div>
                         <span className="text-[10px] font-bold block uppercase" style={{ color: '#94a3b8' }}>العميل</span>
                         <h3 className="text-base font-black" style={{ color: '#1e293b' }}>{customer.name}</h3>
                         {customer.phone && <p className="text-xs font-mono font-bold mt-0.5" style={{ color: '#4b5563' }}>📱 {customer.phone}</p>}
                       </div>
                    </div>
                    <div className="space-y-1 mt-3 pt-3 border-t" style={{ borderColor: '#e2e8f0' }}>
                      <div className="flex justify-between text-xs" style={{ color: '#334155' }}>
                        <span>الحد الائتماني:</span>
                        <strong className="font-mono">{customer.creditLimit > 0 ? formatCurrency(customer.creditLimit) : 'بدون سقف'}</strong>
                      </div>
                      <div className="flex justify-between text-sm font-black" style={{ color: '#e11d48' }}>
                        <span>إجمالي الرصيد المستحق:</span>
                        <strong className="font-mono text-base">{formatCurrency(totalOwed)} {getCurrencySymbol(settings.currency)}</strong>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 2. Transaction Ledger Table */}
                <div className="space-y-2 mb-6">
                  <span className="text-[11px] font-extrabold uppercase px-1" style={{ color: '#94a3b8' }}>السجل التاريخي للعمليات المحاسبية</span>
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="text-[11px] border-b" style={{ backgroundColor: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>
                          <th className="p-3 font-black w-32 border-l" style={{ borderColor: '#e2e8f0' }}>التاريخ والوقت</th>
                          <th className="p-3 font-black">بيان وتفاصيل العملية</th>
                          <th className="p-3 font-black text-center font-mono w-24 border-r" style={{ borderColor: '#e2e8f0', color: '#006948' }}>سداد (-)</th>
                          <th className="p-3 font-black text-center font-mono w-24 border-r" style={{ borderColor: '#e2e8f0', color: '#dc2626' }}>دين (+)</th>
                          <th className="p-3 font-black text-left font-mono w-32 border-r" style={{ borderColor: '#e2e8f0', color: '#0f172a' }}>الرصيد التراكمي</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {ledgerRows.length > 0 ? (
                          ledgerRows.map((tx) => {
                            const isDebt = tx.type === 'debt';
                            return (
                              <tr key={tx.id} className="border-b last:border-0" style={{ borderColor: '#f1f5f9' }}>
                                <td className="p-3 font-mono text-[10px] leading-relaxed border-l" style={{ color: '#64748b', borderColor: '#f8fafc' }}>
                                  <div className="font-bold">{formatDate(tx.date).replace(/^(السبت|الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة)،\s+/, '')}</div>
                                  <div className="text-[9px] mt-0.5 opacity-80">{formatTime(tx.date)}</div>
                                </td>
                                <td className="p-3 font-semibold" style={{ color: '#334155' }}>
                                  {tx.description}
                                </td>
                                <td className="p-3 text-center font-bold font-mono border-r bg-emerald-50/30" style={{ color: '#059669', borderColor: '#f8fafc' }}>
                                  {!isDebt ? formatCurrency(tx.amount) : '0'}
                                </td>
                                <td className="p-3 text-center font-bold font-mono border-r bg-rose-50/30" style={{ color: '#dc2626', borderColor: '#f8fafc' }}>
                                  {isDebt ? formatCurrency(tx.amount) : '0'}
                                </td>
                                <td className="p-3 text-left font-black font-mono border-r bg-slate-50/50" style={{ color: '#1e293b', borderColor: '#f8fafc' }}>
                                  {formatCurrency(tx.currentBalance)}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-8 text-center font-bold" style={{ color: '#94a3b8' }}>
                              لا توجد عمليات مسجلة للعميل في كشف الحساب الحالي.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Footer Summary */}
                <div className="flex gap-4 items-stretch mb-6">
                  {/* Ledger Aggregations Summary */}
                  <div className="flex-1 rounded-xl p-4 flex justify-between gap-4 font-sans text-xs" style={{ backgroundColor: 'rgba(0, 105, 72, 0.05)', border: '1px solid rgba(0, 105, 72, 0.1)', color: '#334155' }}>
                    <div className="space-y-1.5 text-center flex-1">
                      <div className="font-bold opacity-80">إجمالي الديون (+)</div>
                      <div className="font-mono font-black text-sm" style={{ color: '#dc2626' }}>{formatCurrency(totalDebtsAdded)}</div>
                    </div>
                    <div className="w-px" style={{ backgroundColor: 'rgba(0, 105, 72, 0.15)' }} />
                    <div className="space-y-1.5 text-center flex-1">
                      <div className="font-bold opacity-80">إجمالي المدفوع (-)</div>
                      <div className="font-mono font-black text-sm" style={{ color: '#059669' }}>{formatCurrency(totalPaymentsMade)}</div>
                    </div>
                    <div className="w-px" style={{ backgroundColor: 'rgba(0, 105, 72, 0.15)' }} />
                    <div className="space-y-1.5 text-center flex-1" style={{ color: '#006948' }}>
                      <div className="font-black">المستحق النهائي</div>
                      <div className="font-mono font-black text-[15px]">{formatCurrency(totalOwed)} <span className="text-[10px]">{getCurrencySymbol(settings.currency)}</span></div>
                    </div>
                  </div>
                </div>

                {/* 4. Payment Reminder & Output Details */}
                <div className="pt-4 mt-2 flex justify-between items-center text-xs" style={{ borderTop: '1px solid #e2e8f0', color: '#94a3b8' }}>
                  <div className="font-bold bg-amber-50 text-amber-700 px-4 py-2 rounded-lg border border-amber-200">
                    ⚠️ يرجى سداد المستحقات. {settings.storePhone ? `رقم المتجر: ${settings.storePhone}` : ''}
                  </div>
                  <div className="flex flex-col items-end gap-1 font-bold">
                    <span className="flex items-center gap-1.5">
                       <Lock size={12} />
                       مخرجات نظام بلال المحاسبي
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Modal footer controls */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-white/5 flex gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex-1 py-3.5 bg-[#68dba9] text-[#002114] rounded-xl hover:brightness-110 active:scale-95 transition-all text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-[#68dba9]/10 cursor-pointer disabled:opacity-50"
          >
            <FileDown size={16} className={`${isDownloading ? 'animate-bounce' : ''}`} />
            <span>{isDownloading ? 'جاري إعداد وتحميل PDF المالي...' : 'تنزيل كشف الحساب مباشرة كملف PDF'}</span>
          </button>
          
          <button
            onClick={onClose}
            className="px-6 py-3.5 bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-[#bccac0] rounded-xl text-xs font-semibold select-none active:scale-95 transition-all"
          >
            إغلاق
          </button>
        </div>

      </div>

    </div>
  );
}
