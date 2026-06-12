import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Settings, 
  Bell, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  ChevronLeft, 
  X,
  Wallet,
  Coins,
  LineChart
} from 'lucide-react';
import { Customer, StoreSettings } from '../types';
import { getCustomerBalance, isOverCreditLimit, formatCurrency, getCurrencySymbol, getCurrencyName } from '../storage';

interface CustomerListProps {
  customers: Customer[];
  settings: StoreSettings;
  onSelectCustomer: (customer: Customer) => void;
  onAddCustomerClick: () => void;
  onSettingsClick: () => void;
  onReportsClick: () => void;
}

export default function CustomerList({ 
  customers, 
  settings, 
  onSelectCustomer, 
  onAddCustomerClick, 
  onSettingsClick,
  onReportsClick
}: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Calculations based on active data
  const totalOutstandingDebt = customers.reduce((acc, cust) => {
    const bal = getCustomerBalance(cust);
    return bal > 0 ? acc + bal : acc;
  }, 0);

  const debtorsCount = customers.filter(cust => getCustomerBalance(cust) > 0).length;
  const budgetOverLimitCount = customers.filter(cust => isOverCreditLimit(cust)).length;

  // 2. Filter search list
  const filteredCustomers = customers.filter(cust => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      cust.name.toLowerCase().includes(term) || 
      cust.phone.includes(term)
    );
  });

  // Determines color codes for avatar backgrounds automatically based on status
  const getAvatarColors = (cust: Customer) => {
    const bal = getCustomerBalance(cust);
    if (isOverCreditLimit(cust)) {
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    } else if (bal > 0) {
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    } else if (bal < 0) {
      return 'bg-[#3b82f6]/15 text-[#60a5fa] border-[#3b82f6]/30';
    } else {
      return 'bg-[#4ade80]/15 text-[#4ade80] border-[#4ade80]/30';
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[#0b1c30] text-slate-800 dark:text-white flex flex-col relative pb-32 animate-[fadeIn_0.3s_ease] transition-colors duration-300" dir="rtl">
      
      {/* Top Application Header / AppBar */}
      <header className="w-full sticky top-0 z-40 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/5 shadow-md transition-colors duration-300">
        <div className="flex justify-between items-center px-6 py-4 w-full h-20 max-w-container-max mx-auto">
          <div className="flex items-center gap-3">
            {settings.logo ? (
              <img 
                src={settings.logo} 
                alt="Store Logo" 
                className="w-12 h-12 rounded-xl object-cover border border-[#68dba9]/20 shadow-lg shadow-[#00855d]/10" 
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#006948] to-[#064e3b] flex items-center justify-center shadow-lg shadow-[#68dba9]/10 border border-white/10">
                <Coins size={22} className="text-[#68dba9]" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-extrabold text-[#00855d] dark:text-[#68dba9] tracking-tight">{settings.name}</h1>
              <span className="text-[10px] text-emerald-600 dark:text-[#6aa18c] uppercase tracking-wider font-bold block">Premium Edition 💎</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => alert('نظام التنبيهات مدمج وسيقوم بتنبيهك تلقائياً عند تجاوز الديون للحد الأقصى.')}
              className="p-2.5 bg-slate-100 dark:bg-[#1e293b]/70 rounded-full text-slate-600 dark:text-[#bccac0] hover:text-[#68dba9] transition-all hover:bg-slate-200 dark:hover:bg-[#1e293b] active:scale-95 border border-slate-200 dark:border-white/5"
            >
              <Bell size={18} />
            </button>
            <button 
              onClick={onSettingsClick}
              className="p-2.5 bg-slate-100 dark:bg-[#1e293b]/70 rounded-full text-slate-600 dark:text-[#bccac0] hover:text-[#68dba9] transition-all hover:bg-slate-200 dark:hover:bg-[#1e293b] active:scale-95 border border-slate-200 dark:border-white/5"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Ledger Dashboard contents */}
      <main className="flex-1 max-w-container-max w-full mx-auto px-6 pt-5 space-y-6">
        
        {/* Hero Debt Balance Summary Card */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#006948] to-[#064e3b] p-7 shadow-2xl shadow-emerald-950/40 border border-white/10">
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-[#85f8c4]/15 rounded-full blur-2xl" />
          
          <div className="relative z-10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#85f8c4] font-semibold tracking-wide flex items-center gap-1.5">
                إجمالي الديون المستحقة على العملاء 💼
              </span>
              <span className="text-sm">💎</span>
            </div>

            <div className="flex items-baseline gap-2 pt-1 font-sans">
              <span className="text-3xl font-black text-white leading-none tracking-tight">
                {formatCurrency(totalOutstandingDebt)}
              </span>
              <span className="text-xs text-[#85f8c4] font-bold">{getCurrencyName(settings.currency)}</span>
            </div>

            <div className="flex items-center gap-2 bg-black/15 w-fit px-3 py-1.5 rounded-lg border border-white/5 mt-4 text-[11px] text-[#85f8c4]">
              <TrendingUp size={14} className="text-[#85f8c4]" />
              <span className="font-semibold">تحديث اللحظة مستمد من المعاملات المتراكمة</span>
            </div>
          </div>
        </section>

        {/* Quick Stats Bento Grid Section */}
        <section className="grid grid-cols-3 gap-3">
          
          {/* Box 1: Customers Count */}
          <div className="bg-white dark:bg-[#1e293b]/60 border border-slate-200 dark:border-white/[0.04] backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md dark:shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#68dba9]/10 flex items-center justify-center mb-1 text-[#00855d] dark:text-[#68dba9]">
              <Users size={18} />
            </div>
            <span className="text-lg font-black text-slate-800 dark:text-white">{customers.length}</span>
            <span className="text-[10px] text-slate-500 dark:text-[#bccac0] font-semibold">عميل مسجل</span>
          </div>

          {/* Box 2: Active Debtors Count */}
          <div className="bg-white dark:bg-[#1e293b]/60 border border-slate-200 dark:border-white/[0.04] backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md dark:shadow-sm">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center mb-1 text-rose-500 dark:text-rose-400">
              <Users size={18} />
            </div>
            <span className="text-lg font-black text-slate-800 dark:text-white">{debtorsCount}</span>
            <span className="text-[10px] text-slate-500 dark:text-[#bccac0] font-semibold">مدينون حاليون</span>
          </div>

          {/* Box 3: Limit Violators */}
          <div className="bg-white dark:bg-[#1e293b]/60 border border-slate-200 dark:border-white/[0.04] backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md dark:shadow-sm">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-1 text-amber-500 dark:text-amber-400">
              <AlertTriangle size={17} />
            </div>
            <span className="text-lg font-black text-slate-800 dark:text-white">{budgetOverLimitCount}</span>
            <span className="text-[10px] text-slate-500 dark:text-[#bccac0] font-semibold">تجاوزوا الحد</span>
          </div>

        </section>

        {/* Search Input Bar (Sticky above list) */}
        <section className="bg-slate-50/90 dark:bg-[#0b1c30]/90 backdrop-blur-md py-2 sticky top-[80px] z-30 transition-colors duration-300">
          <div className="relative group">
            <Search 
              size={18} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#bccac0] transition-colors group-focus-within:text-[#68dba9]" 
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم أو رقم الجوال..."
              className="w-full pr-12 pl-10 py-3.5 bg-white dark:bg-[#192638] rounded-2xl border border-slate-200 dark:border-white/5 text-slate-850 dark:text-white placeholder-slate-400 dark:placeholder-[#bccac0]/40 outline-none focus:ring-2 focus:ring-[#68dba9]/40 text-sm shadow-md transition-all font-sans"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#bccac0] hover:bg-white/10"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </section>

        {/* Customer List Container */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white font-headline-md">قائمة السجلات الأخيرة 📝</h2>
            <span className="text-[11px] text-slate-500 dark:text-[#bccac0]/60">عدد النتائج: {filteredCustomers.length}</span>
          </div>

          <div className="space-y-3">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((cust) => {
                const balance = getCustomerBalance(cust);
                const overLimit = isOverCreditLimit(cust);
                const colorString = getAvatarColors(cust);
                const firstChar = cust.name.trim().charAt(0) || '👤';

                return (
                  <div
                    key={cust.id}
                    onClick={() => onSelectCustomer(cust)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#192638]/70 hover:bg-slate-100 dark:hover:bg-[#192638] active:scale-[0.99] cursor-pointer border border-slate-200 dark:border-white/[0.04] transition-all hover:translate-y-[-1px] group shadow-inner"
                  >
                    {/* Customer Color Badge Avatar */}
                    <div className={`w-13 h-13 rounded-2xl flex items-center justify-center font-bold text-lg border shadow-sm ${colorString} shrink-0`}>
                      {firstChar}
                    </div>

                    {/* Customer Info Name/Phone */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate group-hover:text-[#68dba9] transition-colors font-sans">
                        {cust.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-[#bccac0]/60 mt-0.5 font-mono">{cust.phone || 'بدون هاتف'}</p>
                    </div>

                    {/* Customer Balance dynamic visual labels */}
                    <div className="text-left flex flex-col items-end gap-1 font-sans">
                      <p className={`text-sm font-black ${
                        balance > 0 ? 'text-rose-400' : balance < 0 ? 'text-sky-400' : 'text-gray-400'
                      }`}>
                        {formatCurrency(balance)}
                        <span className="text-[9px] font-normal mr-1">{getCurrencySymbol(settings.currency)}</span>
                      </p>

                      {/* Over limit / debt status banners */}
                      {overLimit ? (
                        <span className="text-[9px] font-bold px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/15">
                          تجاوز الحد
                        </span>
                      ) : balance > 0 ? (
                        <span className="text-[9px] font-bold px-2.5 py-1 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/15">
                          دين مستحق
                        </span>
                      ) : balance < 0 ? (
                        <span className="text-[9px] font-bold px-2.5 py-1 bg-blue-500/10 text-[#60a5fa] rounded-lg border border-blue-500/15">
                          له مبلغ زائد
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-2.5 py-1 bg-[#1e293b] text-gray-400 rounded-lg border border-white/5">
                          خالص الحساب
                        </span>
                      )}
                    </div>

                    {/* Right-to-Left RTL navigation arrow indicator */}
                    <ChevronLeft size={16} className="text-[#bccac0]/30 group-hover:text-[#68dba9] group-hover:translate-x-[-2px] transition-all shrink-0" />
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center flex flex-col items-center justify-center bg-white dark:bg-[#1e293b]/30 rounded-3xl border border-dashed border-slate-200 dark:border-white/5 shadow-sm">
                <p className="text-slate-500 dark:text-[#bccac0]/50 text-sm">لم يتم العثور على نتائج للبحث الحالي</p>
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="mt-3 text-[#68dba9] text-xs hover:underline font-bold"
                >
                  إعادة تعيين مرشح البحث
                </button>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Floating Action Pulsating Button to add Customer */}
      <button
        onClick={onAddCustomerClick}
        className="fixed bottom-26 left-6 w-15 h-15 bg-gradient-to-br from-[#006948] to-[#064e3b] text-[#68dba9] rounded-full flex items-center justify-center shadow-2xl z-50 hover:scale-105 active:scale-95 transition-all animate-[fabPulse_2s_infinite] border border-[#68dba9]/30"
      >
        <Plus size={32} />
      </button>

      {/* Footer Nav Bar mockup */}
      <nav className="fixed bottom-0 w-full z-45 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md shadow-2xl border-t border-slate-200 dark:border-[#bccac0]/10 transition-colors duration-300">
        <div className="flex justify-around items-center h-20 w-full max-w-container-max mx-auto px-4">
          
          <button 
            className="flex flex-col items-center justify-center bg-[#68dba9]/10 text-[#006948] dark:text-[#68dba9] rounded-2xl px-5 py-2 hover:opacity-90 active:scale-95 transition-all shadow-md shadow-[#68dba9]/5"
          >
            <Users size={20} />
            <span className="text-[11px] font-extrabold mt-1">العملاء</span>
          </button>

          <button 
            onClick={onReportsClick}
            className="flex flex-col items-center justify-center p-2 text-slate-500 dark:text-[#bccac0] hover:text-[#68dba9] active:scale-95 transition-all cursor-pointer"
          >
            <LineChart size={20} />
            <span className="text-[11px] font-bold mt-1.5">التقارير</span>
          </button>

          <button 
            onClick={onSettingsClick}
            className="flex flex-col items-center justify-center p-2 text-slate-500 dark:text-[#bccac0] hover:text-[#68dba9] active:scale-95 transition-all"
          >
            <Settings size={20} />
            <span className="text-[11px] font-bold mt-1.5">الإعدادات</span>
          </button>
          
        </div>
      </nav>

    </div>
  );
}
