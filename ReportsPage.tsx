import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle, 
  ArrowRight, 
  Coins, 
  Sparkles,
  Settings,
  DollarSign,
  PieChart,
  Activity
} from 'lucide-react';
import { Customer, StoreSettings } from '../types';
import { getCustomerBalance, isOverCreditLimit, formatCurrency, getCurrencySymbol, getCurrencyName } from '../storage';

interface ReportsPageProps {
  customers: Customer[];
  settings: StoreSettings;
  onBackToCustomers: () => void;
  onSettingsClick: () => void;
}

export default function ReportsPage({
  customers,
  settings,
  onBackToCustomers,
  onSettingsClick
}: ReportsPageProps) {
  
  // 1. Core Analytics Calculations
  const metrics = React.useMemo(() => {
    let totalDebts = 0;   // Sum of debt transactions
    let totalPayments = 0; // Sum of payment transactions
    let activeOutstanding = 0; // Net balance sum for customers with positive balance
    let creditLimitOverages = 0; // Overages past credit limits
    let clearedCustomersCount = 0;
    
    customers.forEach(cust => {
      const bal = getCustomerBalance(cust);
      if (bal > 0) {
        activeOutstanding += bal;
        if (cust.creditLimit > 0 && bal > cust.creditLimit) {
          creditLimitOverages += (bal - cust.creditLimit);
        }
      } else if (bal === 0) {
        clearedCustomersCount++;
      }
      
      cust.transactions.forEach(tx => {
        if (tx.type === 'debt') {
          totalDebts += tx.amount;
        } else {
          totalPayments += tx.amount;
        }
      });
    });

    const totalCustomers = customers.length;
    const activeDebtorsCount = customers.filter(c => getCustomerBalance(c) > 0).length;
    const overLimitCount = customers.filter(c => isOverCreditLimit(c)).length;
    
    return {
      totalDebts,
      totalPayments,
      activeOutstanding,
      creditLimitOverages,
      clearedCustomersCount,
      totalCustomers,
      activeDebtorsCount,
      overLimitCount,
      avgDebt: activeDebtorsCount > 0 ? activeOutstanding / activeDebtorsCount : 0
    };
  }, [customers]);

  // 2. Sort customers by outstanding debts to list the top debtors
  const topDebtors = React.useMemo(() => {
    return customers
      .map(c => ({
        ...c,
        balance: getCustomerBalance(c)
      }))
      .filter(c => c.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5); // top 5
  }, [customers]);

  // 3. Status Distributions for Visual Charts
  const distribution = React.useMemo(() => {
    const counts = { overLimit: 0, healthyDebt: 0, paidUp: 0 };
    customers.forEach(c => {
      const bal = getCustomerBalance(c);
      if (isOverCreditLimit(c)) {
        counts.overLimit++;
      } else if (bal > 0) {
        counts.healthyDebt++;
      } else {
        counts.paidUp++;
      }
    });
    return counts;
  }, [customers]);

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[#0b1c30] text-slate-800 dark:text-white flex flex-col relative pb-32 animate-[fadeIn_0.3s_ease] transition-colors duration-300" dir="rtl">
      
      {/* AppBar Header */}
      <header className="w-full sticky top-0 z-40 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/5 shadow-md transition-colors duration-300">
        <div className="flex justify-between items-center px-6 py-4 w-full h-20 max-w-container-max mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBackToCustomers}
              className="p-2.5 bg-slate-100 dark:bg-[#1e293b]/70 rounded-full text-slate-600 dark:text-[#bccac0] hover:text-[#68dba9] transition-all hover:bg-slate-200 dark:hover:bg-[#1e293b] active:scale-95 border border-slate-200 dark:border-white/5"
            >
              <ArrowRight size={18} />
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-[#00855d] dark:text-[#68dba9] tracking-tight">التقارير المالية والتحليلات</h1>
              <span className="text-[10px] text-emerald-600 dark:text-[#6aa18c] font-bold block">إحصاءات شاملة ومباشرة لمتجرك 📊</span>
            </div>
          </div>
          
          <button 
            onClick={onSettingsClick}
            className="p-2.5 bg-slate-100 dark:bg-[#1e293b]/70 rounded-full text-slate-600 dark:text-[#bccac0] hover:text-[#68dba9] transition-all hover:bg-slate-200 dark:hover:bg-[#1e293b] active:scale-95 border border-slate-200 dark:border-white/5"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Reports Panel Scrollable Content */}
      <main className="flex-1 max-w-container-max w-full mx-auto px-6 pt-5 space-y-6">
        
        {/* Consolidated summary dashboard section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Box 1: Inflow/Outflow Overview Card */}
          <div className="bg-gradient-to-br from-[#006948] to-[#064e3b] rounded-3xl p-6 text-white border border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <BarChart3 size={90} />
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-white/10 rounded-lg">
                <Coins size={16} className="text-[#68dba9]" />
              </div>
              <span className="text-xs text-[#85f8c4] font-bold">إجمالي الديون النشطة للعملاء</span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className="text-3xl font-black tracking-tight">{formatCurrency(metrics.activeOutstanding)}</span>
              <span className="text-xs text-[#85f8c4]">{getCurrencySymbol(settings.currency)}</span>
            </div>
            <div className="text-[11px] text-[#85f8c4]/80 leading-relaxed border-t border-white/10 pt-3">
              يمثل هذا صافي المبالغ المستحقة فعلياً التي يجب تحصيلها من العملاء حالياً.
            </div>
          </div>

          {/* Box 2: Total Debt Recorded Card */}
          <div className="bg-white dark:bg-[#192638] rounded-3xl p-6 border border-slate-200 dark:border-white/[0.04] shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
                <TrendingUp size={16} />
              </div>
              <span className="text-xs text-slate-500 dark:text-[#bccac0] font-bold">إجمالي المبيعات بالآجل (الديون التاريخية)</span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-2xl font-black text-rose-500 dark:text-rose-450 tracking-tight">{formatCurrency(metrics.totalDebts)}</span>
              <span className="text-xs text-slate-400">{getCurrencySymbol(settings.currency)}</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-[#bccac0]/60 mt-2">
              مجموع كافة فواتير الديون المسجلة تاريخياً لحسابات جميع عملائك.
            </p>
          </div>

          {/* Box 3: Total Paid Recorded Card */}
          <div className="bg-white dark:bg-[#192638] rounded-3xl p-6 border border-slate-200 dark:border-white/[0.04] shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                <TrendingDown size={16} />
              </div>
              <span className="text-xs text-slate-500 dark:text-[#bccac0] font-bold">إجمالي السدادات المحصلة (النقد المتراكم)</span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-450 tracking-tight">{formatCurrency(metrics.totalPayments)}</span>
              <span className="text-xs text-slate-400">{getCurrencySymbol(settings.currency)}</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-[#bccac0]/60 mt-2">
              مجموع دفعات السداد المستلمة نقداً أو عبر تحويلات من عملائك وسجلت باليومية.
            </p>
          </div>

        </section>

        {/* Extended Accounting Indices */}
        <section className="bg-white dark:bg-[#192638]/60 border border-slate-200 dark:border-white/[0.04] backdrop-blur-md rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-150 dark:border-white/5">
            <Sparkles size={16} className="text-[#00855d] dark:text-[#68dba9]" />
            <h2 className="text-xs font-bold font-sans">مؤشرات محاسبية سريعة</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
              <span className="text-[10px] text-slate-500 dark:text-[#bccac0]/70 block font-medium">متوسط المديونية لكل عميل نشط</span>
              <span className="text-lg font-extrabold text-slate-800 dark:text-white font-mono mt-1 block">
                {formatCurrency(metrics.avgDebt)}
                <span className="text-[10px] font-medium mr-1">{getCurrencySymbol(settings.currency)}</span>
              </span>
            </div>
            
            <div className="bg-slate-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
              <span className="text-[10px] text-slate-500 dark:text-[#bccac0]/70 block font-medium">المبالغ المتجاوزة لسقف المديونية</span>
              <span className="text-lg font-extrabold text-amber-500 dark:text-amber-400 font-mono mt-1 block">
                {formatCurrency(metrics.creditLimitOverages)}
                <span className="text-[10px] font-medium mr-1">{getCurrencySymbol(settings.currency)}</span>
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
              <span className="text-[10px] text-slate-500 dark:text-[#bccac0]/70 block font-medium">عملاء تم تصفية حساباتهم خالصاً</span>
              <span className="text-lg font-extrabold text-emerald-600 dark:text-[#68dba9] mt-1 block">
                {metrics.clearedCustomersCount}
                <span className="text-xs text-slate-500 dark:text-[#bccac0]/70 mr-1">عملاء</span>
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
              <span className="text-[10px] text-slate-500 dark:text-[#bccac0]/70 block font-medium">النسبة المئوية للتحصيل المالي</span>
              <span className="text-lg font-extrabold text-sky-500 mt-1 block font-mono">
                {metrics.totalDebts > 0 ? ((metrics.totalPayments / metrics.totalDebts) * 100).toFixed(1) : '100'}%
              </span>
            </div>
          </div>
        </section>

        {/* Visual Distribution Chart / Analysis representation */}
        <section className="bg-white dark:bg-[#192638]/60 border border-slate-200 dark:border-white/[0.04] backdrop-blur-md rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-150 dark:border-white/5">
            <PieChart size={16} className="text-[#00855d] dark:text-[#68dba9]" />
            <h2 className="text-xs font-bold">توزيع العملاء حسب تصنيف المديونية</h2>
          </div>

          <div className="space-y-3 pt-1">
            {/* ProgressBar 1: Over credit limit */}
            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1.5 text-slate-600 dark:text-[#bccac0]">
                <span>عملاء متجاوزين لسقف الائتمان ({distribution.overLimit})</span>
                <span>{metrics.totalCustomers > 0 ? ((distribution.overLimit / metrics.totalCustomers) * 100).toFixed(0) : '0'}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${metrics.totalCustomers > 0 ? (distribution.overLimit / metrics.totalCustomers) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* ProgressBar 2: Active healthy debt */}
            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1.5 text-slate-600 dark:text-[#bccac0]">
                <span>عملاء بمديونيات تحت السقف المسموح ({distribution.healthyDebt})</span>
                <span>{metrics.totalCustomers > 0 ? ((distribution.healthyDebt / metrics.totalCustomers) * 100).toFixed(0) : '0'}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-rose-505 bg-rose-450 bg-rose-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${metrics.totalCustomers > 0 ? (distribution.healthyDebt / metrics.totalCustomers) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* ProgressBar 3: Cleared/Healthy credit */}
            <div>
              <div className="flex justify-between text-[11px] font-bold mb-1.5 text-slate-600 dark:text-[#bccac0]">
                <span>عملاء بخالص الحساب أو أرصدة دائنة ({distribution.paidUp})</span>
                <span>{metrics.totalCustomers > 0 ? ((distribution.paidUp / metrics.totalCustomers) * 100).toFixed(0) : '0'}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${metrics.totalCustomers > 0 ? (distribution.paidUp / metrics.totalCustomers) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Highest Debtors ranking section (Top 5) */}
        <section className="bg-white dark:bg-[#192638]/60 border border-slate-200 dark:border-white/[0.04] backdrop-blur-md rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-150 dark:border-white/5">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-rose-500" />
              <h2 className="text-xs font-bold">قائمة أكبر ديون مستحقة (الأكثر مطالبة الماليين)</h2>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-[#bccac0]/60">قمم الذمم المالية 🔝</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {topDebtors.length > 0 ? (
              topDebtors.map((cust, idx) => {
                const firstChar = cust.name.trim().charAt(0) || '👤';
                return (
                  <div 
                    key={cust.id} 
                    onClick={onBackToCustomers}
                    className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-[#1a2638] border border-slate-150 dark:border-white/[0.02] cursor-pointer hover:bg-slate-100 dark:hover:bg-[#1b2b40] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-rose-500/15 text-rose-500 dark:text-rose-450 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-white font-bold text-sm">
                        {firstChar}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">{cust.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-[#bccac0]/60 font-mono mt-0.5">{cust.phone || 'بدون هاتف'}</p>
                      </div>
                    </div>
                    
                    <div className="text-left">
                      <p className="text-xs font-black text-rose-550 dark:text-rose-400 font-mono">
                        {formatCurrency(cust.balance)}
                        <span className="text-[9px] font-normal mr-1">{getCurrencySymbol(settings.currency)}</span>
                      </p>
                      {cust.creditLimit > 0 && cust.balance > cust.creditLimit && (
                        <span className="inline-block text-[8px] bg-rose-500/10 text-rose-400 font-bold px-1.5 py-0.5 rounded mt-1 border border-rose-500/20">
                          تجاوز بـ {formatCurrency(cust.balance - cust.creditLimit)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-[#bccac0]/50">
                لا توجد ديون نشطة لأي عميل حالياً في هذا الدفتر المحاسبي.
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Identical Footer Nav Bar */}
      <nav className="fixed bottom-0 w-full z-45 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md shadow-2xl border-t border-slate-200 dark:border-[#bccac0]/10 transition-colors duration-300">
        <div className="flex justify-around items-center h-20 w-full max-w-container-max mx-auto px-4">
          
          <button 
            onClick={onBackToCustomers}
            className="flex flex-col items-center justify-center p-2 text-slate-500 dark:text-[#bccac0] hover:text-[#68dba9] active:scale-95 transition-all"
          >
            <Users size={20} />
            <span className="text-[11px] font-bold mt-1.5">العملاء</span>
          </button>

          <button 
            className="flex flex-col items-center justify-center bg-[#68dba9]/10 text-[#006948] dark:text-[#68dba9] rounded-2xl px-5 py-2 hover:opacity-90 active:scale-95 transition-all shadow-md shadow-[#68dba9]/5"
          >
            <PieChart size={20} />
            <span className="text-[11px] font-extrabold mt-1">التقارير</span>
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
