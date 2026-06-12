import React, { useState } from 'react';
import { X, User, Phone, Banknote, Contact, Search } from 'lucide-react';
import { Customer } from '../types';

interface AddCustomerModalProps {
  onClose: () => void;
  onAdd: (name: string, phone: string, limit: number) => void;
}

export default function AddCustomerModal({ onClose, onAdd }: AddCustomerModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [errorString, setErrorString] = useState('');

  const pickContact = async () => {
    try {
      const nav = navigator as any;
      
      if (window.self !== window.top) {
        alert('تنبيه: ميزة جلب جهات الاتصال تتعارض مع وضع المعاينة المُضمن. يرجى فتح التطبيق في علامة تبويب جديدة للاستفادة من هذه الميزة (أيقونة السهم في أعلى يمين الشاشة).');
        return;
      }

      if (!nav.contacts || typeof nav.contacts.select !== 'function') {
        alert('للأسف، واجهة استيراد جهات الاتصال الأصلية غير مدعومة في متصفحك الحالي أو نظام التشغيل (مدعومة أندرويد كروم).');
        return;
      }
      
      const properties = await nav.contacts.select(['name', 'tel'], { multiple: false });
      if (properties && properties.length > 0) {
        const contact = properties[0];
        const fetchedName = contact.name && contact.name[0] ? contact.name[0] : '';
        const fetchedPhone = contact.tel && contact.tel[0] ? contact.tel[0] : '';
        if (fetchedName) setName(fetchedName);
        if (fetchedPhone) setPhone(fetchedPhone);
      }
    } catch (err) {
      console.warn('Native contact picker error:', err);
      // Usually fails if user cancels or permission denied
      if (err instanceof Error && err.name === 'NotAllowedError') {
         alert('لم يتم منح صلاحيات الوصول لجهات الاتصال. يرجى السماح للتطبيق بالوصول من إعدادات المتصفح.');
      } else if (err instanceof Error && err.name === 'SecurityError') {
         alert('عذراً، أمان المتصفح يمنع الوصول في هذا الوضع. يرجى فتح التطبيق برابط مباشر في علامة تبويب جديدة.');
      } else {
         alert('حدث خطأ أثناء محاولة فتح واجهة جهات الاتصال الخاصة بالهاتف. تفاصيل: ' + (err as Error).message);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorString('الرجاء إدخال اسم العميل');
      return;
    }
    const limitNum = parseFloat(creditLimit) || 0;
    onAdd(name.trim(), phone.trim(), limitNum);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-[#0b1c30] w-full max-w-lg rounded-3xl overflow-hidden flex flex-col border border-slate-200 dark:border-[#68dba9]/20 shadow-2xl animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)] transition-colors duration-300 relative">
        
        {/* Modal Header */}
        <div className="p-6 pb-4 flex justify-between items-start border-b border-slate-200 dark:border-[#bccac0]/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00855d]/10 dark:bg-[#00855d]/20 flex items-center justify-center text-[#00855d] dark:text-[#68dba9]">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-sans">إضافة عميل جديد</h2>
              <p className="text-xs text-slate-500 dark:text-[#bccac0]/70">إدخال سجلات وبيانات العميل والمستحقات</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-[#bccac0] active:scale-95 transition-transform"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          
          {/* Contact Picker Selection Section */}
          <div>
            <button
              type="button"
              onClick={pickContact}
              className="w-full bg-[#00855d] text-white py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all hover:bg-[#00855d]/85 active:scale-95 border border-[#68dba9]/30 shadow-lg"
            >
              <Contact size={20} className="text-[#68dba9]" />
              <span className="font-bold text-sm">📱 اختيار من جهات الاتصال</span>
            </button>
            <p className="text-center text-[10px] text-slate-400 dark:text-[#bccac0]/60 mt-2">يقوم بفتح لوحة جهات الاتصال الخاصة بجهازك بشكل مباشر وتلقائي</p>
          </div>

          {/* Customer Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1" htmlFor="customer_name">
              👤 اسم العميل كملف حساب <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="relative">
              <input
                id="customer_name"
                type="text"
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrorString('');
                }}
                placeholder="مثال: بلال سيف شعلان"
                className="w-full bg-slate-50 dark:bg-[#111c2d] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl py-3.5 pr-11 pl-4 focus:ring-2 focus:ring-[#68dba9] outline-none transition-all placeholder-slate-400 text-xs font-semibold"
              />
              <User size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            {errorString && <p className="text-rose-500 text-[11px] px-1 font-bold">{errorString}</p>}
          </div>

          {/* Customer Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1" htmlFor="phone_number">
              📱 رقم الجوال للتواصل
            </label>
            <div className="relative">
              <input
                id="phone_number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="77XXXXXXX أو 05XXXXXXX"
                dir="ltr"
                className="w-full bg-slate-50 dark:bg-[#111c2d] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl py-3.5 pr-11 pl-4 focus:ring-2 focus:ring-[#68dba9] outline-none transition-all text-right placeholder-slate-400 text-xs font-semibold font-mono"
              />
              <Phone size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Credit Limit */}
          <div className="space-y-1.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1" htmlFor="credit_limit">
                🎯 الحد الأقصى للدين (سقف المديونية)
              </label>
              <span className="text-[10px] text-slate-400 block">يقوم النظام بتنبيهك عند تجاوز العميل للسقف المحدد للحساب (صفر يعني مديونية مفتوحة)</span>
            </div>
            <div className="relative">
              <input
                id="credit_limit"
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="مثال: 50000"
                className="w-full bg-slate-50 dark:bg-[#111c2d] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white rounded-xl py-3.5 pr-11 pl-4 focus:ring-2 focus:ring-[#68dba9] outline-none transition-all placeholder-slate-400 text-xs font-semibold font-mono"
              />
              <Banknote size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Sticky action buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-white/[0.08]">
            <button
              type="submit"
              className="flex-1 bg-[#68dba9] text-[#002114] py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              ✓ إضافة العميل وقيد حسابه
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 rounded-xl text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-colors active:scale-95 border border-slate-200 dark:border-white/[0.08] cursor-pointer"
            >
              إلغاء الأمر
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
