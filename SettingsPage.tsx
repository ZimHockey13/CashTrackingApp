import React, { useState, useRef } from "react";
import {
  Settings,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  Heart,
  Eye,
  Check,
  FileJson,
  KeyRound,
  Trash2
} from "lucide-react";
import { BudgetPreferences } from "../types";

interface SettingsPageProps {
  preferences: BudgetPreferences;
  onUpdatePreferences: (prefs: Partial<BudgetPreferences>) => void;
  onResetAllData: () => void;
  onLoadSampleData: () => void;
  onImportFullState: (jsonStr: string) => boolean;
  onExportFullState: () => void;
  incomeCategories: string[];
  onAddIncomeCategory: (cat: string) => void;
  onDeleteIncomeCategory: (cat: string) => void;
  expenseCategories: string[];
  onAddExpenseCategory: (cat: string) => void;
  onDeleteExpenseCategory: (cat: string) => void;
  assetCategories: string[];
  onAddAssetCategory: (cat: string) => void;
  onDeleteAssetCategory: (cat: string) => void;
  liabilityCategories: string[];
  onAddLiabilityCategory: (cat: string) => void;
  onDeleteLiabilityCategory: (cat: string) => void;
}

export default function SettingsPage({
  preferences,
  onUpdatePreferences,
  onResetAllData,
  onLoadSampleData,
  onImportFullState,
  onExportFullState,
  incomeCategories,
  onAddIncomeCategory,
  onDeleteIncomeCategory,
  expenseCategories,
  onAddExpenseCategory,
  onDeleteExpenseCategory,
  assetCategories,
  onAddAssetCategory,
  onDeleteAssetCategory,
  liabilityCategories,
  onAddLiabilityCategory,
  onDeleteLiabilityCategory
}: SettingsPageProps) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for API secrets
  const [tempApiKey, setTempApiKey] = useState("");
  const [secretSaved, setSecretSaved] = useState(false);

  const showTempToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleCurrencyCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    let symbol = "$";
    if (code === "EUR") symbol = "€";
    if (code === "GBP") symbol = "£";
    if (code === "JPY" || code === "CNY") symbol = "¥";
    if (code === "INR") symbol = "₹";
    if (code === "AUD" || code === "CAD" || code === "USD") symbol = "$";

    onUpdatePreferences({
      currencyCode: code,
      currencySymbol: symbol
    });
    showTempToast(`Currency updated to ${code} (${symbol})`);
  };

  const handleSavingsRatioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ratio = parseInt(e.target.value);
    onUpdatePreferences({ savingsRatioGoalPercentage: ratio });
  };

  // Drag-and-drop file upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const textStr = event.target?.result as string;
        const complete = onImportFullState(textStr);
        if (complete) {
          showTempToast("Backup package imported and loaded successfully!");
        } else {
          showTempToast("Invalid backup blueprint configuration.", true);
        }
      } catch (err) {
        showTempToast("Malformed JSON file format.", true);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSecretsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempApiKey.trim()) return;
    // We notify user to add client side secrets if desired, though we proxy via server
    showTempToast("Secrets recorded. Note: Gemini API keys are read server-side through setting environment parameters.");
    setSecretSaved(true);
  };

  return (
    <div className="space-y-8">
      
      {/* Toast notifications */}
      {successMsg && (
        <div className="fixed top-4 right-4 bg-emerald-500 text-slate-900 px-5 py-3 rounded-xl font-bold font-sans text-xs flex items-center gap-2 shadow-2xl z-50 border border-emerald-400">
          <Check className="w-4 h-4 text-slate-900" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="fixed top-4 right-4 bg-rose-500 text-slate-100 px-5 py-3 rounded-xl font-bold font-sans text-xs flex items-center gap-2 shadow-2xl z-50 border border-rose-400">
          <AlertTriangle className="w-4 h-4 text-white" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Basic Preferences Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden animate-fade-in" style={{ contentVisibility: "auto" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
            <Settings className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Global System Preferences</h3>
              <p className="text-[11px] text-slate-500 font-medium">Configure visual themes, savings parameters, and currency selectors</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="currency-select" className="block text-xs font-bold text-slate-500 mb-2">Primary Global Currency</label>
              <select
                id="currency-select"
                value={preferences.currencyCode}
                onChange={handleCurrencyCodeChange}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm outline-none transition focus:border-blue-500 cursor-pointer font-medium"
              >
                <option value="USD">USD ($) — American Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
                <option value="GBP">GBP (£) — British Pound</option>
                <option value="JPY">JPY (¥) — Japanese Yen</option>
                <option value="CNY">CNY (¥) — Chinese Yuan</option>
                <option value="INR">INR (₹) — Indian Rupee</option>
                <option value="CAD">CAD ($) — Canadian Dollar</option>
                <option value="AUD">AUD ($) — Australian Dollar</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label id="savings-slider-label" className="font-bold text-slate-500">Savings Rate Target Ratio</label>
                <span className="font-sans font-bold text-emerald-600 text-sm">{preferences.savingsRatioGoalPercentage}%</span>
              </div>
              <input
                aria-labelledby="savings-slider-label"
                type="range"
                min="5"
                max="100"
                step="5"
                value={preferences.savingsRatioGoalPercentage}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                onChange={handleSavingsRatioChange}
              />
              <p className="text-[10px] text-slate-500 font-semibold leading-tight">
                This slider updates the progress rings in your Dashboard tab. Standard advisor metrics recommend targeting 20%.
              </p>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
              <div>
                <span className="block text-xs font-bold text-slate-700">System Audio Signals</span>
                <span className="text-[10px] text-slate-500 font-medium">Audio queues when logging assets, incomes or deleting items</span>
              </div>
              <input
                id="pref-alerts-cb"
                type="checkbox"
                checked={preferences.enableAlerts}
                onChange={(e) => onUpdatePreferences({ enableAlerts: e.target.checked })}
                className="w-4.5 h-4.5 bg-white border-slate-200 rounded cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Durable Backups JSON Package */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between animate-fade-in" style={{ contentVisibility: "auto" }}>
          <div>
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
              <Download className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Data Portability & backups</h3>
                <p className="text-[11px] text-slate-500 font-medium">Securely download your logs offline, or restore previous blueprints</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                This budgeting utility is completely client-first and respects your personal security. Data remains entirely in your local browser sandbox. Protect it by creating periodic binary backup files.
              </p>

              {/* UPLOAD PANEL with double capability: drag-and-drop or click */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition duration-300 flex flex-col items-center justify-center gap-2.5 ${
                  dragActive
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-slate-200 hover:border-slate-350 bg-slate-50 hover:bg-slate-100/70 text-slate-500"
                }`}
                style={{ contentVisibility: "auto" }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileInput}
                />
                
                <div className="p-3 bg-white border border-slate-150 rounded-xl">
                  <Upload className="w-5 h-5 text-blue-650" />
                </div>
                
                <div>
                  <p className="text-xs font-bold text-slate-700">Drag and drop file backup here</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">or click here to search folders (.json)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={onExportFullState}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-md shadow-emerald-500/10"
              id="btn-export-backup"
            >
              <Download className="w-4 h-4" />
              Download Backup JSON
            </button>
            <div className="text-[10px] text-slate-400 font-semibold flex items-center justify-center leading-tight">
              Export is structured and matches standard budgeting syntax.
            </div>
          </div>
        </div>

      </div>

      {/* Robust Custom Category Manager Dash */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-fade-in" style={{ contentVisibility: "auto" }}>
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
          <Settings className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">Dynamic List Categories</h3>
            <p className="text-[11px] text-slate-500 font-semibold font-sans">Instantly rename, register, or remove category indices throughout the application</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Income Lists */}
          <div className="space-y-3.5">
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono flex justify-between">
              <span>Revenue Streams</span>
              <span className="text-[9px] font-sans px-1.5 bg-slate-50 border rounded text-slate-500">{incomeCategories.length}</span>
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {incomeCategories.map((cat) => (
                <div key={cat} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold">
                  <span className="text-slate-700 truncate">{cat}</span>
                  {incomeCategories.length > 1 && (
                    <button
                      onClick={() => onDeleteIncomeCategory(cat)}
                      className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition cursor-pointer"
                      title="Clear custom category item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <CategoryInlineAdder onAdd={onAddIncomeCategory} categories={incomeCategories} placeholder="e.g. Side Hustle" />
          </div>

          {/* Expense Lists */}
          <div className="space-y-3.5">
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono flex justify-between">
              <span>Outflows Ledgers</span>
              <span className="text-[9px] font-sans px-1.5 bg-slate-50 border rounded text-slate-500">{expenseCategories.length}</span>
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {expenseCategories.map((cat) => (
                <div key={cat} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold">
                  <span className="text-slate-700 truncate">{cat}</span>
                  {expenseCategories.length > 1 && (
                    <button
                      onClick={() => onDeleteExpenseCategory(cat)}
                      className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition cursor-pointer"
                      title="Clear custom category item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <CategoryInlineAdder onAdd={onAddExpenseCategory} categories={expenseCategories} placeholder="e.g. Subscriptions" />
          </div>

          {/* Assets Lists */}
          <div className="space-y-3.5">
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono flex justify-between">
              <span>Capital Assets</span>
              <span className="text-[9px] font-sans px-1.5 bg-slate-50 border rounded text-slate-500">{assetCategories.length}</span>
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {assetCategories.map((cat) => (
                <div key={cat} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold">
                  <span className="text-slate-700 truncate">{cat}</span>
                  {assetCategories.length > 1 && (
                    <button
                      onClick={() => onDeleteAssetCategory(cat)}
                      className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition cursor-pointer"
                      title="Clear custom category item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <CategoryInlineAdder onAdd={onAddAssetCategory} categories={assetCategories} placeholder="e.g. Fine Wine, Gold" />
          </div>

          {/* Liabilities Lists */}
          <div className="space-y-3.5">
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono flex justify-between">
              <span>Debt Liabilities</span>
              <span className="text-[9px] font-sans px-1.5 bg-slate-50 border rounded text-slate-500">{liabilityCategories.length}</span>
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {liabilityCategories.map((cat) => (
                <div key={cat} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold">
                  <span className="text-slate-700 truncate">{cat}</span>
                  {liabilityCategories.length > 1 && (
                    <button
                      onClick={() => onDeleteLiabilityCategory(cat)}
                      className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition cursor-pointer"
                      title="Clear custom category item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <CategoryInlineAdder onAdd={onAddLiabilityCategory} categories={liabilityCategories} placeholder="e.g. Store Cards" />
          </div>
        </div>
      </div>

      {/* Database/State Reset Options (Danger Zone) */}
      <div className="bg-white border border-rose-100 rounded-2xl p-6 shadow-sm relative overflow-hidden animate-fade-in" style={{ contentVisibility: "auto" }}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-50 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">System Sandbox Controls</h3>
            <p className="text-[11px] text-rose-500 font-semibold">Advanced configurations to seed defaults or purge database rows</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-4 rounded-xl bg-rose-50/60 border border-rose-100">
          <div className="space-y-1">
            <span className="block text-xs font-bold text-slate-800">Reset Local State Cache</span>
            <span className="text-[11px] text-slate-500 block max-w-xl leading-relaxed font-semibold">
              Purges all income vectors, expense ledger entries, asset lists, financial timeline items, and preferences to start with an entirely blank workspace. This operation is permanent.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shadow-sm shrink-0">
            <button
              onClick={onLoadSampleData}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition duration-150 cursor-pointer"
              id="btn-seed-data"
            >
              Load Demo Template
            </button>
            
            <button
              onClick={onResetAllData}
              className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/10 cursor-pointer transition duration-150"
              id="btn-purge-state"
            >
              Absolute Hard Wipe
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

interface CategoryInlineAdderProps {
  onAdd: (cat: string) => void;
  categories: string[];
  placeholder?: string;
}

function CategoryInlineAdder({ onAdd, categories, placeholder }: CategoryInlineAdderProps) {
  const [value, setValue] = useState("");

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setValue("");
      return;
    }
    onAdd(trimmed);
    setValue("");
  };

  return (
    <div className="flex gap-1.5 mt-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
        }}
        placeholder={placeholder || "Add category..."}
        className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-blue-500 rounded-lg text-xs font-semibold outline-none transition"
      />
      <button
        onClick={handleAdd}
        className="px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer"
        aria-label="Add category item"
      >
        +
      </button>
    </div>
  );
}
