import React, { useState } from 'react';
import { 
  ArrowRight, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  Share2, 
  Image, 
  FileText, 
  Plus, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Paperclip, 
  X,
  CreditCard,
  Phone,
  MessageCircle,
  MessageSquare,
  FileDown
} from 'lucide-react';
import { Customer, Transaction, StoreSettings } from '../types';
import { 
  getCustomerBalance, 
  isOverCreditLimit, 
  formatCurrency, 
  formatDate, 
  formatTime,
  getCurrencySymbol,
  getRemainingCredit
} from '../storage';
import AddTransactionModal from './AddTransactionModal';
import StatementPreviewModal from './StatementPreviewModal';

interface CustomerDetailProps {
  customer: Customer;
  settings: StoreSettings;
  onBack: () => void;
  onDeleteCustomer: (id: string) => void;
  onUpdateCustomer: (id: string, name: string, phone: string, limit: number) => void;
  onAddTransaction: (customerId: string, description: string, amount: number, type: 'debt' | 'payment', attachment?: string | null, attachmentName?: string) => void;
  onDeleteTransaction: (customerId: string, transactionId: string) => void;
}

export default function CustomerDetail({
  customer,
  settings,
  onBack,
  onDeleteCustomer,
  onUpdateCustomer,
  onAddTransaction,
  onDeleteTransaction
}: CustomerDetailProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState<false | 'debt' | 'payment'>(false);
  const [activeAttachment, setActiveAttachment] = useState<string | null>(null);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showLimitExceededWarning, setShowLimitExceededWarning] = useState(false);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<{
    type: 'customer' | 'transaction';
    targetId: string;
    title: string;
    details: string;
  } | null>(null);

  // Edit fields state
  const [editName, setEditName] = useState(customer.name);
  const [editPhone, setEditPhone] = useState(customer.phone);
  const [editLimit, setEditLimit] = useState(customer.creditLimit.toString());

  // Show limit warning when entering the customer account if already exceeded
  React.useEffect(() => {
    if (customer.creditLimit > 0 && balance >= customer.creditLimit) {
      setShowLimitExceededWarning(true);
    }
  }, [customer.id]);

  // Keep edit fields in sync when customer or showEditModal changed
  React.useEffect(() => {
    setEditName(customer.name);
    setEditPhone(customer.phone);
    setEditLimit(customer.creditLimit.toString());
  }, [customer, showEditModal]);

  const balance = getCustomerBalance(customer);
  const overLimit = isOverCreditLimit(customer);
  const transactionsLength = customer.transactions.length;

  // Compute transaction date boundaries to resemble statement
  const getStatementBoundaries = () => {
    if (customer.transactions.length === 0) return 'لا توجد معاملات بعد';
    const dates = customer.transactions.map(t => new Date(t.date).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    const fmt = (d: Date) => d.toLocaleDateString('ar-YE', { day: 'numeric', month: 'short' });
    return `${fmt(minDate)} - ${fmt(maxDate)} ${maxDate.getFullYear()}`;
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    onUpdateCustomer(customer.id, editName.trim(), editPhone.trim(), parseFloat(editLimit) || 0);
    setShowEditModal(false);
  };

  const handleCreateTx = (desc: string, amount: number, attachment?: string | null, attachmentName?: string) => {
    if (showTxModal) {
      if (showTxModal === 'debt' && customer.creditLimit > 0 && balance >= customer.creditLimit) {
        setShowTxModal(false);
        setShowLimitExceededWarning(true);
        return;
      }
      onAddTransaction(customer.id, desc, amount, showTxModal, attachment, attachmentName);
      setShowTxModal(false);
      
      if (showTxModal === 'debt' && customer.creditLimit > 0 && (balance + amount) >= customer.creditLimit) {
        setTimeout(() => setShowLimitExceededWarning(true), 300);
      }
    }
  };

  const sendCeilingWhatsAppWarning = () => {
    const text = encodeURIComponent(
`⚠️ *تنبيه محاسبي عاجل* ⚠️

السيد الفاضل 👤 *${customer.name}* المحترم

نحيطكم علماً بأنه قد تم بلوغ سقف المديونية المحدد لحسابكم لدى 🏪 *${settings.name}*.
💰 *الحد الأقصى:* ${formatCurrency(customer.creditLimit)} ${getCurrencySymbol(settings.currency)}
🛑 *الرصيد الحالي:* ${formatCurrency(balance)} ${getCurrencySymbol(settings.currency)}

نرجو منكم المبادرة بالسداد ليتسنى لنا إضافة أي معاملات جديدة لحسابكم.
شاكرين لكم حسن التعاون الدائم.`);
    const cleanPhone = customer.phone.replace(/[\s-]/g, '');
    let dialPhone = cleanPhone;
    if (cleanPhone.startsWith('05')) {
      dialPhone = '966' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('77') || cleanPhone.startsWith('73') || cleanPhone.startsWith('71')) {
      dialPhone = '967' + cleanPhone;
    }
    window.open(`https://wa.me/${dialPhone}?text=${text}`, '_blank');
    setShowLimitExceededWarning(false);
  };

  const generateWhatsAppShare = () => {
    const text = encodeURIComponent(
`🕌 السلام عليكم ورحمة الله وبركاته 💐

📋 *كشف حساب مالي مستحق*

السيد الفاضل 👤 *${customer.name}* المحترم

📌 نحيطكم علماً بأن الرصيد المستحق عليكم لدى
🏪 *${settings.name}*

💰 *المبلغ المطالب به:* ${formatCurrency(balance)} ${getCurrencySymbol(settings.currency)}

🤝 نأمل منكم تكرماً التنسيق لموجب السداد في أقرب وقت متاح.
💐 شاكرين لكم حسن التعاون الدائم معنا وجزاكم الله خيراً.

🏪 مخرجات حسابية من: *${settings.name}*`);
    
    const cleanPhone = customer.phone.replace(/[\s-]/g, '');
    let dialPhone = cleanPhone;
    if (cleanPhone.startsWith('05')) {
      dialPhone = '966' + cleanPhone.substring(1); // Standardized to Saudi code for fallback
    } else if (cleanPhone.startsWith('77') || cleanPhone.startsWith('73') || cleanPhone.startsWith('71')) {
      dialPhone = '967' + cleanPhone; // Standardized to Yemen code
    }
    
    window.open(`https://wa.me/${dialPhone}?text=${text}`, '_blank');
  };

  const generateSMSUrl = () => {
    const text = `السلام عليكم ${customer.name}، نود تذكيركم بأن رصيدكم المستحق لدى ${settings.name} هو ${formatCurrency(balance)} ${getCurrencySymbol(settings.currency)}. يرجى السداد شاكرين لكم.`;
    window.open(`sms:${customer.phone}?body=${encodeURIComponent(text)}`);
  };

  const downloadStatementLocal = () => {
    setShowStatementModal(true);
  };

  const getHeaderColors = () => {
    if (overLimit) return 'from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-800 border-amber-500/30 text-white';
    if (balance > 0) return 'from-white to-slate-50 dark:from-[#0b1c30] dark:to-[#111c2d] border-slate-200 dark:border-rose-500/20 text-slate-800 dark:text-white';
    if (balance < 0) return 'from-sky-500 to-sky-600 dark:from-sky-700 dark:to-sky-900 border-sky-600/30 text-white';
    return 'from-emerald-500 to-emerald-600 dark:from-[#006948] dark:to-[#064e3b] border-[#68dba9]/30 text-white';
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[#071321] text-slate-800 dark:text-white flex flex-col relative pb-32 animate-[fadeIn_0.3s_ease] transition-colors duration-300" dir="rtl">
      
      {/* Detail AppBar */}
      <header className="flex items-center justify-between px-6 w-full h-16 bg-white dark:bg-[#111c2d] sticky top-0 z-40 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors active:scale-95"
          >
            <ArrowRight size={20} className="text-[#00855d] dark:text-[#68dba9]" />
          </button>
          <h1 className="text-base font-bold text-slate-900 dark:text-white font-headline-md">كشف الحساب المالي</h1>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors active:scale-95 text-slate-500 dark:text-[#bccac0]"
          >
            <MoreVertical size={20} />
          </button>

          {showMenu && (
            <div className="absolute left-0 mt-2 w-48 rounded-xl bg-white dark:bg-[#111c2d] border border-slate-200 dark:border-white/10 shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-white/5 animate-[scaleIn_0.2s_ease]">
              <button 
                onClick={() => {
                  setShowEditModal(true);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 text-right text-xs text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
              >
                <Edit3 size={15} className="text-[#00855d] dark:text-[#68dba9]" />
                <span>تعديل بيانات العميل</span>
              </button>
              <button 
                onClick={() => {
                  setConfirmDeleteTarget({
                    type: 'customer',
                    targetId: customer.id,
                    title: customer.name,
                    details: `سيتم حذف هذا العميل نهائياً من النظام مع كافة العمليات والنقليات والذمم المسجلة بحسابه والبالغ عددها (${transactionsLength}) عملية. يرجى العلم أن هذا الإجراء غير قابل للتراجع.`
                  });
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 text-right text-xs text-rose-500 dark:text-rose-400 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
              >
                <Trash2 size={15} />
                <span>حذف العميل نهائياً</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container Statement Content */}
      <div className="flex-1 px-5 py-6 overflow-y-auto pb-40">
        
        {/* Dynamic Contextual Header Summary Card */}
        <section className="mb-6 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#68dba9]/20 to-[#3b82f6]/20 rounded-3xl blur-md opacity-40 transition" />
          
          <div className={`relative bg-gradient-to-br ${getHeaderColors()} rounded-3xl p-6 border shadow-2xl overflow-hidden`}>
            
            {/* Background Accent Sphere */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#68dba9]/10 rounded-full blur-2xl" />
            
            <div className="flex flex-col gap-4 relative z-10">
              
              {/* Account initial / name container */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xs text-slate-500 dark:text-[#bccac0] mb-1 font-semibold">اسم العميل ورقم الهاتف</h2>
                  <p className="text-lg font-black font-headline-md flex items-center gap-2">
                    {customer.name}
                    {overLimit && (
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 rounded-full animate-bounce">
                        تجاوز الحد!
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-[#bccac0]/70 font-mono mt-0.5">{customer.phone || 'بدون هاتف'}</p>
                </div>
                <div className="w-13 h-13 rounded-2xl bg-[#68dba9]/15 border border-[#68dba9]/30 flex items-center justify-center text-[#00855d] dark:text-[#68dba9]">
                  <CreditCard size={24} />
                </div>
              </div>

              {/* Total Balance Block */}
              <div className="border-t border-slate-200 dark:border-white/10 pt-4">
                <h2 className="text-xs text-slate-500 dark:text-[#bccac0] mb-1 font-medium">الرصيد المتبقي المستحق</h2>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black ${
                    balance > 0 ? 'text-rose-500 dark:text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]' : balance < 0 ? 'text-sky-300' : 'text-slate-500 dark:text-gray-300'
                  }`}>
                    {formatCurrency(balance)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-[#bccac0] font-bold">{getCurrencySymbol(settings.currency)}</span>
                </div>
                
                {/* Under/Over Limit Details */}
                {customer.creditLimit > 0 && (
                  <div className="mt-2 text-[10px] text-slate-500 dark:text-[#bccac0]/80 flex gap-2">
                    <span>الحد الأقصى: <strong className="font-mono">{formatCurrency(customer.creditLimit)}</strong></span>
                    <span>|</span>
                    {balance > customer.creditLimit ? (
                      <span className="text-amber-600 dark:text-amber-400 font-bold">متجاوز بـ: <strong className="font-mono">{formatCurrency(balance - customer.creditLimit)}</strong></span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400">المتاح له: <strong className="font-mono">{formatCurrency(customer.creditLimit - balance)}</strong></span>
                    )}
                  </div>
                )}
              </div>

              {/* Counts of items / boundaries */}
              <div className="flex justify-between items-center text-slate-600 dark:text-[#bccac0] text-[10px] bg-slate-100/50 dark:bg-white/[0.04] p-3 rounded-2xl border border-slate-200 dark:border-white/[0.04] font-mono mt-1">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-[#00855d] dark:text-[#68dba9]" />
                  <span>عدد المعاملات: {transactionsLength}</span>
                </div>
                <div>
                  <span>⏱️ {getStatementBoundaries()}</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* Action controls button panel row */}
        <section className="grid grid-cols-3 gap-2.5 mb-7">
          <button 
            onClick={generateWhatsAppShare}
            className="flex flex-col items-center justify-center py-3.5 rounded-2xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all border border-[#25D366]/20 active:scale-95"
          >
            <MessageCircle size={20} className="mb-1" />
            <span className="text-[10px] font-bold">مشاركة واتساب</span>
          </button>

          <button 
            onClick={generateSMSUrl}
            className="flex flex-col items-center justify-center py-3.5 rounded-2xl bg-[#00855d]/10 text-[#00855d] dark:text-[#68dba9] hover:bg-[#00855d]/20 transition-all border border-[#00855d]/20 active:scale-95"
          >
            <MessageSquare size={20} className="mb-1" />
            <span className="text-[10px] font-bold">رسالة نصية</span>
          </button>

          <button 
            onClick={downloadStatementLocal}
            className="flex flex-col items-center justify-center py-3.5 rounded-2xl bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-all border border-sky-500/20 active:scale-95"
          >
            <FileDown size={20} className="mb-1" />
            <span className="text-[10px] font-bold">تحميل PDF الكشف</span>
          </button>
        </section>

        {/* Register Actions Quick Buttons */}
        <div className="grid grid-cols-2 gap-3.5 mb-8">
          <button 
            onClick={() => {
              if (customer.creditLimit > 0 && balance >= customer.creditLimit) {
                setShowLimitExceededWarning(true);
              } else {
                setShowTxModal('debt');
              }
            }}
            className="py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:brightness-110 active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-950/20 border border-rose-500/10"
          >
            <Plus size={16} />
            <span>📝 تسجيل دين جديد</span>
          </button>

          <button 
            onClick={() => setShowTxModal('payment')}
            className="py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:brightness-110 active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 border border-emerald-500/10"
          >
            <Plus size={16} />
            <span>💰 تسجيل دفعة سداد</span>
          </button>
        </div>

        {/* Records / Journal list header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white font-headline-md">سجل العمليات التاريخية 🧾</h3>
          <span className="text-[11px] text-slate-500 dark:text-[#bccac0]/60 font-mono">العدد: {transactionsLength}</span>
        </div>

        {/* Custom scroll list of transaction entries */}
        <div className="space-y-3.5">
          {transactionsLength > 0 ? (
            customer.transactions
              .slice()
              .reverse() // Display newest transaction first
              .map((tx) => {
                const isDebt = tx.type === 'debt';
                return (
                  <div 
                    key={tx.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#111c2d] border border-slate-200 dark:border-white/[0.04] flex justify-between items-center hover:bg-slate-100 dark:hover:bg-[#152338] transition-all relative group shadow-sm"
                  >
                    <div className="flex gap-3 items-center min-w-0">
                      
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isDebt ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20' : 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                      }`}>
                        {isDebt ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                      </div>

                      {/* Content details */}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[190px]">{tx.description}</p>
                        <p className="text-[10px] text-slate-500 dark:text-[#bccac0]/70 font-mono mt-1 flex items-center gap-1">
                          <span>⏱️ {formatDate(tx.date)}</span>
                          <span>|</span>
                          <span>{formatTime(tx.date)}</span>
                        </p>
                      </div>

                    </div>

                    {/* Left balance + deletion & attachment preview triggers */}
                    <div className="flex items-center gap-2">
                       <div className="text-left font-mono">
                        <p className={`text-sm font-black ${isDebt ? 'text-rose-500 dark:text-rose-400' : 'text-green-600 dark:text-green-400'}`}>
                          {formatCurrency(tx.amount)}
                        </p>
                        
                        {/* Attached document flag indicator icon */}
                        {tx.attachment && (
                          <button
                            type="button"
                            onClick={() => setActiveAttachment(tx.attachment || null)}
                            className="text-[#00855d] dark:text-[#68dba9] hover:underline flex items-center gap-0.5 mt-1 text-[10px]"
                          >
                            <Paperclip size={10} />
                            <span>مرفق</span>
                          </button>
                        )}
                      </div>

                      {/* Remove transaction action */}
                      <button 
                        onClick={() => {
                          setConfirmDeleteTarget({
                            type: 'transaction',
                            targetId: tx.id,
                            title: `${tx.description} (${formatCurrency(tx.amount)} ${getCurrencySymbol(settings.currency)})`,
                            details: `سيتم إزالة هذا السجل المالي نهائياً وتحديث كشف حساب ورصيد العميل بالخصم أو الإضافة الفورية.`
                          });
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 select-none group-hover:opacity-100 opacity-20 transition-all scale-90"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                  </div>
                );
              })
          ) : (
            <div className="py-12 bg-white dark:bg-[#111c2d]/50 rounded-2xl border border-dashed border-slate-200 dark:border-white/5 text-center text-slate-500 dark:text-[#bccac0]/50 text-xs shadow-sm">
              لا توجد عمليات مضافة لحساب هذا العميل بعد، ابدأ بتسجيل معاملة جديدة.
            </div>
          )}
        </div>

      </div>

      {/* Floating Action Pulsating Button to add Debt specifically */}
      <button
        onClick={() => {
          if (customer.creditLimit > 0 && balance >= customer.creditLimit) {
            setShowLimitExceededWarning(true);
          } else {
            setShowTxModal('debt');
          }
        }}
        className="fixed bottom-26 left-6 w-14 h-14 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-xl z-[45] active:scale-95 transition-transform cursor-pointer"
      >
        <Plus size={28} />
      </button>

      {/* Popups and Inline Modals */}

      {/* Add Transaction Modal */}
      {showTxModal && (
        <AddTransactionModal
          type={showTxModal}
          currency={settings.currency}
          onClose={() => setShowTxModal(false)}
          onAdd={handleCreateTx}
        />
      )}

      {/* Edit Customer Dialog */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]" dir="rtl">
          <div className="bg-white dark:bg-[#0b1c30] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 animate-[scaleIn_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white font-headline-md">✏️ تعديل سجل وبيانات العميل</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 dark:text-[#bccac0] p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/5">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs text-slate-600 dark:text-[#bccac0] mb-1 font-medium">اسم العميل ورقم الهاتف</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#111c2d] border border-slate-200 dark:border-[#3d4a42]/60 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#68dba9] text-sm text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-[#bccac0] mb-1 font-medium">رقم الهاتف للجوال</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#111c2d] border border-slate-200 dark:border-[#3d4a42]/60 text-right rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#68dba9] text-sm text-slate-800 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-[#bccac0] mb-1 font-medium">سقف المديونية الأقصى</label>
                <input
                  type="number"
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#111c2d] border border-slate-200 dark:border-[#3d4a42]/60 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#68dba9] text-sm text-slate-800 dark:text-white font-mono"
                />
              </div>

               <div className="flex flex-col gap-2 pt-3">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#68dba9] text-[#002114] font-black text-xs rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  ✓ حفظ التغييرات والبيانات
                </button>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setConfirmDeleteTarget({
                        type: 'customer',
                        targetId: customer.id,
                        title: customer.name,
                        details: `سيتم حذف هذا العميل نهائياً من النظام مع كافة العمليات والنقليات والذمم المسجلة بحسابه والبالغ عددها (${transactionsLength}) عملية. يرجى العلم أن هذا الإجراء غير قابل للتراجع.`
                      });
                    }}
                    className="flex-1 py-3 bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-500 font-bold text-xs rounded-xl active:scale-95 transition-all border border-rose-500/20 cursor-pointer"
                  >
                    🗑️ حذف العميل
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-[#bccac0] rounded-xl text-xs active:scale-95 transition-all text-center shrink-0 cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Attachment Viewer Overlay */}
      {activeAttachment && (
        <div 
          onClick={() => setActiveAttachment(null)}
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-pointer animate-[fadeIn_0.2s_ease]"
        >
          <button 
            onClick={() => setActiveAttachment(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10"
          >
            <X size={24} />
          </button>
          
          <div className="relative max-w-full max-h-[85vh] overflow-hidden rounded-xl bg-black flex items-center justify-center border border-white/5">
            {activeAttachment.startsWith('data:image/') ? (
              <img 
                src={activeAttachment} 
                alt="Fullscreen Attachment Receipt" 
                className="max-w-full max-h-[80vh] object-contain object-center" 
              />
            ) : (
              <div className="p-12 text-center text-white flex flex-col items-center justify-center gap-3">
                <FileText size={64} className="text-[#68dba9] animate-bounce" />
                <p className="text-sm font-bold">الملف المرفق هو مستند PDF</p>
                <p className="text-xs text-[#bccac0] max-w-[280px]">يمكن تنزيله مباشرة على جهازك في الحفائر الحية.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statement Preview & Instant PDF download */}
      <StatementPreviewModal
        customer={customer}
        settings={settings}
        isOpen={showStatementModal}
        onClose={() => setShowStatementModal(false)}
      />

      {/* Limit Exceeded Warning Modal */}
      {showLimitExceededWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-55 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]" dir="rtl" style={{ zIndex: 100 }}>
          <div className="bg-white dark:bg-[#0b1c30] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-amber-500/30 animate-[scaleIn_0.3s_cubic-bezier(0.16,1,0.3,1)] p-6 space-y-5 text-center">
            
            <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <span className="text-2xl">🛑</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">
                ⚠️ وصول الحد الأعلى للسقف!
              </h3>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                لقد وصل أو تجاوز العميل سقف المديونية، لا يمكن إضافة مديونية جديدة حتى يتم السداد أو تعديل السقف.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-[#bccac0]/80 leading-relaxed font-mono">
                الحد: {formatCurrency(customer.creditLimit)} | الرصيد الحالي: {formatCurrency(balance)}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={sendCeilingWhatsAppWarning}
                className="w-full py-3 bg-[#25D366] hover:bg-[#25D366]/90 text-white font-black text-xs rounded-xl active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} />
                إرسال رسالة تنبيه عبر واتساب للعميل
              </button>
              
              <button
                type="button"
                onClick={() => setShowLimitExceededWarning(false)}
                className="w-full py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-[#bccac0] hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-white/5 cursor-pointer"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {confirmDeleteTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-55 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]" dir="rtl" style={{ zIndex: 100 }}>
          <div className="bg-white dark:bg-[#0b1c30] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-red-500/20 dark:border-red-500/10 animate-[scaleIn_0.3s_cubic-bezier(0.16,1,0.3,1)] p-6 space-y-5 text-center">
            
            {/* Warning Icon */}
            <div className="mx-auto w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Trash2 size={26} />
            </div>

            {/* Title & Details */}
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">
                {confirmDeleteTarget.type === 'customer' ? '⚠️ تأكيد حذف حساب العميل نهائياً' : '⚠️ تأكيد حذف المعاملة المالية'}
              </h3>
              <p className="text-xs font-bold text-[#00855d] dark:text-[#68dba9] tracking-tight">
                {confirmDeleteTarget.title}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-[#bccac0]/80 leading-relaxed">
                {confirmDeleteTarget.details}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (confirmDeleteTarget.type === 'customer') {
                    onDeleteCustomer(confirmDeleteTarget.targetId);
                  } else {
                    onDeleteTransaction(customer.id, confirmDeleteTarget.targetId);
                  }
                  setConfirmDeleteTarget(null);
                }}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl active:scale-95 transition-all shadow-md shadow-rose-950/20 cursor-pointer"
              >
                🗑️ نعم، متأكد وأريد الحذف الآن
              </button>
              
              <button
                type="button"
                onClick={() => setConfirmDeleteTarget(null)}
                className="w-full py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-[#bccac0] hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-white/5 cursor-pointer"
              >
                تراجع وإلغاء
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
