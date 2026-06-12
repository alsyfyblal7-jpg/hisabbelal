import React, { useState, useEffect } from 'react';
import { Customer, StoreSettings } from './types';
import { 
  getCustomers, 
  saveCustomers, 
  getStoreSettings, 
  saveStoreSettings,
  formatCurrency,
  getCurrencySymbol
} from './storage';
import CustomerList from './components/CustomerList';
import CustomerDetail from './components/CustomerDetail';
import SettingsPage from './components/SettingsPage';
import AddCustomerModal from './components/AddCustomerModal';
import ReportsPage from './components/ReportsPage';

export default function App() {
  const [view, setView] = useState<'list' | 'detail' | 'settings' | 'reports'>('list');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(getStoreSettings());
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  // 1. Initial State Loading
  useEffect(() => {
    // Populate customers
    const loadedCustomers = getCustomers();
    setCustomers(loadedCustomers);
    
    // Apply styling presets dynamically based on store settings
    const metaSettings = getStoreSettings();
    setSettings(metaSettings);
    
    // Force active theme class on html document shell
    if (metaSettings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleUpdateCustomersList = (updated: Customer[]) => {
    setCustomers(updated);
    saveCustomers(updated);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setView('detail');
  };

  const handleAddNewCustomer = (name: string, phone: string, limit: number) => {
    const newCustomer: Customer = {
      id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name,
      phone,
      creditLimit: limit,
      transactions: [],
      createdAt: new Date().toISOString()
    };
    
    const updated = [newCustomer, ...customers];
    handleUpdateCustomersList(updated);
    setShowAddCustomer(false);
    
    // Immediately display newly created customer statement
    setSelectedCustomerId(newCustomer.id);
    setView('detail');
  };

  const handleDeleteCustomer = (id: string) => {
    const updated = customers.filter(c => c.id !== id);
    handleUpdateCustomersList(updated);
    setSelectedCustomerId(null);
    setView('list');
  };

  const handleUpdateCustomerDetails = (id: string, name: string, phone: string, limit: number) => {
    const updated = customers.map(c => {
      if (c.id === id) {
        return { ...c, name, phone, creditLimit: limit };
      }
      return c;
    });
    handleUpdateCustomersList(updated);
  };

  const handleAddTransaction = (
    customerId: string, 
    description: string, 
    amount: number, 
    type: 'debt' | 'payment',
    attachment?: string | null,
    attachmentName?: string
  ) => {
    const updated = customers.map(c => {
      if (c.id === customerId) {
        const newTx = {
          id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          description,
          amount,
          date: new Date().toISOString(),
          type,
          attachment,
          attachmentName
        };

        return {
          ...c,
          transactions: [...c.transactions, newTx]
        };
      }
      return c;
    });
    handleUpdateCustomersList(updated);
  };

  const handleDeleteTransaction = (customerId: string, transactionId: string) => {
    const updated = customers.map(c => {
      if (c.id === customerId) {
        return {
          ...c,
          transactions: c.transactions.filter(t => t.id !== transactionId)
        };
      }
      return c;
    });
    handleUpdateCustomersList(updated);
  };

  // 2. Settings management hooks
  const handleSaveStoreSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    saveStoreSettings(newSettings);
    
    // Toggle active darkness layers
    if (newSettings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 3. Backup: Data Export Download file helper
  const handleExportDataFile = () => {
    try {
      const packageBlob = {
        grocery_store_customers: customers,
        store_settings: settings,
        backup_date: new Date().toISOString(),
        application: 'Bilal Accountant Simple Ledger'
      };
      
      const blob = new Blob([JSON.stringify(packageBlob, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const backup_filename = `بلال_المحاسبي_نسخة_احتياطية_${new Date().toISOString().split('T')[0]}.json`;
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = backup_filename;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('حدث خطأ أثناء محاولة تصدير ملف النسخة الاحتياطية.');
      console.error(err);
    }
  };

  // 4. Backup: Data Import Upload file helper
  const handleImportDataFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (fileEvent) => {
        try {
          const contents = fileEvent.target?.result as string;
          const parsed = JSON.parse(contents);
          
          let importedCustomers: Customer[] = [];
          let importedSettings: StoreSettings | undefined = undefined;

          // Support new format
          if (parsed.grocery_store_customers && Array.isArray(parsed.grocery_store_customers)) {
            importedCustomers = parsed.grocery_store_customers;
            importedSettings = parsed.store_settings;
          } 
          // Support old/alternate format
          else if (parsed.customers && Array.isArray(parsed.customers)) {
            importedCustomers = parsed.customers;
            importedSettings = parsed.settings;
          }
          // Support direct array format
          else if (Array.isArray(parsed)) {
            importedCustomers = parsed;
          }

          if (importedCustomers.length > 0) {
            handleRestoreBackup(importedCustomers, importedSettings);
            alert('تم استيراد واسترجاع قاعدة بيانات المحاسبة ودمج حسابات العملاء بنجاح كامل بدون حذف بياناتك الحالية ✓');
                      
            // Refresh
            window.location.reload();
          } else {
            alert('صيغة الملف غير صحيحة أو لا تحتوي على بيانات عملاء صالحة.');
          }
        } catch (err) {
          alert('فشل استيراد الملف. تأكد من رفعه بصيغة JSON المعايرة بشكل سليم.');
          console.error(err);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRestoreBackup = (newCustomers: Customer[], newSettings?: StoreSettings) => {
    // Merge without deleting new things: keep existing customers, add non-duplicate imported customers
    // Update existing ones if imported one has more recent transactions? Or just merge by ID.
    // The safest "without deleting new things" is appending new customers, and for existing ones merging transactions or just keeping the existing.
    // Let's merge by ID: if it exists, merge transactions.
    
    let mergedCustomers = [...customers];

    newCustomers.forEach(importedCustomer => {
      const existingIndex = mergedCustomers.findIndex(c => c.id === importedCustomer.id || c.name === importedCustomer.name);
      if (existingIndex >= 0) {
        // Merge transactions for the same customer
        const existingCust = mergedCustomers[existingIndex];
        const mergedTransactions = [...existingCust.transactions];
        
        importedCustomer.transactions.forEach(itx => {
           if (!mergedTransactions.find(t => t.id === itx.id)) {
             mergedTransactions.push(itx);
           }
        });
        
        mergedCustomers[existingIndex] = {
           ...existingCust,
           creditLimit: importedCustomer.creditLimit > 0 ? importedCustomer.creditLimit : existingCust.creditLimit,
           transactions: mergedTransactions
        };
      } else {
        // Add completely new customer from backup
        mergedCustomers.push(importedCustomer);
      }
    });

    handleUpdateCustomersList(mergedCustomers);

    if (newSettings) {
      handleSaveStoreSettings(newSettings);
    }
  };

  // Find currently active customer details
  const activeCustomer = customers.find(c => c.id === selectedCustomerId) || null;

  return (
    <div className="w-full min-h-screen bg-[#f3f4f6] dark:bg-[#071321] flex justify-center items-start text-slate-800 dark:text-white overflow-x-hidden font-sans transition-colors duration-300">
      <div className="w-full max-w-container-max min-h-screen flex flex-col relative shadow-2xl bg-white dark:bg-[#0b1c30] select-none border-x border-slate-200 dark:border-[#3d4a42]/10 transition-colors duration-300">
        
        {/* Core Screen Routing Rendering */}
        {view === 'list' && (
          <CustomerList
            customers={customers}
            settings={settings}
            onSelectCustomer={handleSelectCustomer}
            onAddCustomerClick={() => setShowAddCustomer(true)}
            onSettingsClick={() => setView('settings')}
            onReportsClick={() => setView('reports')}
          />
        )}

        {view === 'detail' && activeCustomer && (
          <CustomerDetail
            customer={activeCustomer}
            settings={settings}
            onBack={() => setView('list')}
            onDeleteCustomer={handleDeleteCustomer}
            onUpdateCustomer={handleUpdateCustomerDetails}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {view === 'settings' && (
          <SettingsPage
            settings={settings}
            customers={customers}
            onSaveSettings={handleSaveStoreSettings}
            onExport={handleExportDataFile}
            onImport={handleImportDataFile}
            onRestoreBackup={handleRestoreBackup}
            onBackToCustomers={() => setView('list')}
            onReportsClick={() => setView('reports')}
          />
        )}

        {view === 'reports' && (
          <ReportsPage
            customers={customers}
            settings={settings}
            onBackToCustomers={() => setView('list')}
            onSettingsClick={() => setView('settings')}
          />
        )}

        {/* Modal additions */}
        {showAddCustomer && (
          <AddCustomerModal
            onClose={() => setShowAddCustomer(false)}
            onAdd={handleAddNewCustomer}
          />
        )}

      </div>
    </div>
  );
}
