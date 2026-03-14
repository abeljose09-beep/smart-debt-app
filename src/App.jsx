import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  CreditCard, 
  PieChart, 
  Settings, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  AlertCircle,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Utils ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount);
};

const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};

// --- Components ---

const Card = ({ children, title, subtitle, icon: Icon, color = "indigo" }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{title}</h3>
        {subtitle && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{subtitle}</p>}
      </div>
      {Icon && (
        <div style={{ 
          background: `rgba(99, 102, 241, 0.1)`, 
          padding: '10px', 
          borderRadius: '12px',
          color: 'var(--accent-color)'
        }}>
          <Icon size={24} />
        </div>
      )}
    </div>
    {children}
  </motion.div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 2000, padding: '20px'
    }}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card" 
        style={{ width: '100%', maxWidth: '400px', margin: 0 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            <Trash2 size={24} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  
  // -- Time Management --
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedPeriod, setSelectedPeriod] = useState('full'); // full | q1 | q2

  // -- Profile State --
  const [profile, setProfile] = useLocalStorage('dm_profile', {
    salary: 2500000,
    frequency: 'monthly',
  });
  
  // -- Data States --
  const [fixedExpenses, setFixedExpenses] = useLocalStorage('dm_fixed', []);
  const [variableExpenses, setVariableExpenses] = useLocalStorage('dm_variable', []);
  const [debts, setDebts] = useLocalStorage('dm_debts', []);

  // -- Modals --
  const [showAddFixed, setShowAddFixed] = useState(false);
  const [showAddVar, setShowAddVar] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // --- Calculations ---
  const currentMonthYear = `${new Date().getFullYear()}-${selectedMonth}`;
  
  const currentFixed = useMemo(() => 
    fixedExpenses.filter(e => e.monthYear === currentMonthYear && (selectedPeriod === 'full' || e.period === selectedPeriod || e.period === 'full')),
    [fixedExpenses, currentMonthYear, selectedPeriod]
  );

  const currentVariable = useMemo(() => 
    variableExpenses.filter(e => e.monthYear === currentMonthYear && (selectedPeriod === 'full' || e.period === selectedPeriod)),
    [variableExpenses, currentMonthYear, selectedPeriod]
  );

  const monthlySalary = profile.frequency === 'quincenal' ? profile.salary * 2 : profile.salary;
  const periodSalary = selectedPeriod === 'full' ? monthlySalary : (profile.frequency === 'quincenal' ? profile.salary : monthlySalary / 2);

  const totalFixed = currentFixed.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalSavings = currentFixed.filter(e => e.isSavings).reduce((sum, item) => sum + Number(item.amount), 0);
  const totalVar = currentVariable.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalDebtPayments = debts.reduce((sum, item) => sum + Number(item.monthlyPayment), 0);
  
  const totalRemaining = periodSalary - totalFixed - totalVar - (selectedPeriod === 'full' ? totalDebtPayments : totalDebtPayments/2);

  // --- Handlers ---
  const saveFixed = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const item = {
      id: editingItem?.id || Date.now(),
      name: fd.get('name'),
      amount: Number(fd.get('amount')),
      isSavings: fd.get('isSavings') === 'on',
      period: fd.get('period'),
      monthYear: currentMonthYear
    };
    if (editingItem) setFixedExpenses(fixedExpenses.map(i => i.id === item.id ? item : i));
    else setFixedExpenses([...fixedExpenses, item]);
    setShowAddFixed(false);
  };

  const saveVar = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const item = {
      id: editingItem?.id || Date.now(),
      name: fd.get('name'),
      amount: Number(fd.get('amount')),
      period: selectedPeriod === 'full' ? 'q1' : selectedPeriod,
      monthYear: currentMonthYear,
      date: new Date().toISOString().split('T')[0]
    };
    if (editingItem) setVariableExpenses(variableExpenses.map(i => i.id === item.id ? item : i));
    else setVariableExpenses([...variableExpenses, item]);
    setShowAddVar(false);
  };

  const saveDebt = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const item = {
      id: editingItem?.id || Date.now(),
      name: fd.get('name'),
      totalAmount: Number(fd.get('total')),
      monthlyPayment: Number(fd.get('payment')),
      remaining: Number(fd.get('remaining'))
    };
    if (editingItem) setDebts(debts.map(i => i.id === item.id ? item : i));
    else setDebts([...debts, item]);
    setShowAddDebt(false);
  };

  const deleteItem = (id, type) => {
    if (type === 'fixed') setFixedExpenses(fixedExpenses.filter(i => i.id !== id));
    if (type === 'var') setVariableExpenses(variableExpenses.filter(i => i.id !== id));
    if (type === 'debt') setDebts(debts.filter(i => i.id !== id));
  };

  // --- Views ---

  const TimeSelector = () => (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
        {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((m, i) => (
          <button 
            key={m} 
            onClick={() => setSelectedMonth(i)}
            style={{
              padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border-color)',
              background: selectedMonth === i ? 'var(--accent-color)' : 'var(--surface-color)',
              color: 'white', whiteSpace: 'nowrap', transition: 'all 0.3s'
            }}
          >
            {m}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', background: 'var(--surface-color)', borderRadius: '12px', padding: '4px' }}>
        <button onClick={() => setSelectedPeriod('full')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: selectedPeriod === 'full' ? 'var(--surface-hover)' : 'transparent', color: 'white' }}>Mes</button>
        <button onClick={() => setSelectedPeriod('q1')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: selectedPeriod === 'q1' ? 'var(--surface-hover)' : 'transparent', color: 'white' }}>1° Quin</button>
        <button onClick={() => setSelectedPeriod('q2')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: selectedPeriod === 'q2' ? 'var(--surface-hover)' : 'transparent', color: 'white' }}>2° Quin</button>
      </div>
    </div>
  );

  const HomeView = () => (
    <div className="scroll-area">
      <TimeSelector />
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{selectedPeriod === 'full' ? 'Saldo del Mes' : `Saldo ${selectedPeriod.toUpperCase()}`}</p>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }} className="currency">{formatCurrency(totalRemaining)}</h1>
        <div style={{ marginTop: '8px' }}>
          <span className="badge badge-info">Ingreso: {formatCurrency(periodSalary)}</span>
        </div>
      </div>

      <div className="grid-2">
        <Card title="Fijos" icon={TrendingDown}>
          <p className="currency" style={{ color: 'var(--danger)' }}>-{formatCurrency(totalFixed)}</p>
        </Card>
        <Card title="Variables" icon={TrendingUp}>
          <p className="currency" style={{ color: 'var(--warning)' }}>-{formatCurrency(totalVar)}</p>
        </Card>
      </div>

      <Card title="Ahorros" icon={Wallet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>Total Ahorrado</span>
          <span className="currency" style={{ color: 'var(--success)' }}>{formatCurrency(totalSavings)}</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px' }}>
          <div style={{ width: totalSavings > 0 ? '60%' : '0%', height: '100%', background: 'var(--success)', borderRadius: '4px' }}></div>
        </div>
      </Card>
    </div>
  );

  const ExpensesView = () => (
    <div className="scroll-area">
      <TimeSelector />
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button className="btn-primary" style={{ flex: 1 }} onClick={() => { setEditingItem(null); setShowAddFixed(true); }}>
          + Fijo
        </button>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setEditingItem(null); setShowAddVar(true); }}>
          + Variable
        </button>
      </div>

      <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>Lista de Gastos</h3>
      <div className="glass-card" style={{ padding: 0 }}>
        {[...currentFixed, ...currentVariable].map(item => (
          <div key={item.id} className="list-item" onClick={() => { 
            setEditingItem(item); 
            if ('isSavings' in item) setShowAddFixed(true); else setShowAddVar(true); 
          }}>
            <div>
              <p className="list-item-title">{item.name}</p>
              <p className="list-item-sub">
                {item.isSavings ? 'Ahorro • ' : ''}
                {item.period === 'q1' ? '1° Quin' : item.period === 'q2' ? '2° Quin' : 'Mensual'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="currency">{formatCurrency(item.amount)}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteItem(item.id, 'isSavings' in item ? 'fixed' : 'var'); }}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', opacity: 0.6 }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {[...currentFixed, ...currentVariable].length === 0 && (
          <p style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>Sin registros en este periodo</p>
        )}
      </div>
    </div>
  );

  const DebtsView = () => (
    <div className="scroll-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Deudas</h2>
        <button className="btn-primary" onClick={() => { setEditingItem(null); setShowAddDebt(true); }}>
          + Nueva
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {debts.map(debt => (
          <motion.div key={debt.id} className="glass-card" onClick={() => { setEditingItem(debt); setShowAddDebt(true); }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ fontWeight: '700' }}>{debt.name}</h4>
              <button onClick={(e) => { e.stopPropagation(); deleteItem(debt.id, 'debt'); }} style={{ background: 'none', border: 'none', color: 'var(--danger)' }}>
                <Trash2 size={18} />
              </button>
            </div>
            <div className="grid-2" style={{ marginBottom: '12px' }}>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Faltante</p>
                <p className="currency">{formatCurrency(debt.remaining)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Cuota</p>
                <p className="currency" style={{ color: 'var(--danger)' }}>{formatCurrency(debt.monthlyPayment)}</p>
              </div>
            </div>
          </motion.div>
        ))}
        {debts.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>No tienes deudas registradas</p>
        )}
      </div>
    </div>
  );

  const YearlyView = () => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return (
      <div className="scroll-area">
        <h2 style={{ marginBottom: '20px' }}>Resumen Anual</h2>
        <Card title="Proyección 2024">
          <div className="grid-2" style={{ marginBottom: '20px' }}>
            <div>
              <small style={{ color: 'var(--text-secondary)' }}>Ingreso Anual</small>
              <p className="currency" style={{ color: 'var(--success)' }}>{formatCurrency(monthlySalary * 12)}</p>
            </div>
            <div>
              <small style={{ color: 'var(--text-secondary)' }}>Gasto Fijo Anual</small>
              <p className="currency" style={{ color: 'var(--danger)' }}>{formatCurrency(totalFixed * 12)}</p>
            </div>
          </div>
          <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
            {months.map(m => (
              <div key={m} style={{ flex: 1, background: 'var(--accent-color)', height: `${Math.random() * 50 + 30}%`, borderRadius: '4px 4px 0 0', opacity: 0.6 }}></div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const SettingsView = () => {
    const [tempSalary, setTempSalary] = useState(profile.salary);
    return (
      <div className="scroll-area">
        <h2 style={{ marginBottom: '24px' }}>Ajustes</h2>
        <Card title="Perfil Financiero" icon={Settings}>
          <div className="input-group">
            <label className="input-label">Monto de Sueldo</label>
            <input 
              type="number" className="input-field" 
              value={tempSalary}
              onChange={(e) => setTempSalary(Number(e.target.value))}
              onBlur={() => setProfile({...profile, salary: tempSalary})}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Frecuencia</label>
            <select className="input-field" value={profile.frequency} onChange={(e) => setProfile({...profile, frequency: e.target.value})}>
              <option value="monthly">Mensual</option>
              <option value="quincenal">Quincenal</option>
            </select>
          </div>
        </Card>
        <button 
          className="btn-secondary" 
          style={{ width: '100%', color: 'var(--danger)', borderColor: 'var(--danger)' }}
          onClick={() => { localStorage.clear(); window.location.reload(); }}
        >
          Borrar todos los datos
        </button>
      </div>
    );
  };

  return (
    <div className="app-container">
      <header className="header">
        <h2 style={{ fontWeight: '800' }}>SmartDebt</h2>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DollarSign size={18} color="white" />
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab + selectedMonth + selectedPeriod} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'home' && <HomeView />}
          {activeTab === 'expenses' && <ExpensesView />}
          {activeTab === 'debts' && <DebtsView />}
          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'yearly' && <YearlyView />}
        </motion.div>
      </AnimatePresence>

      <nav className="nav-bar">
        {[
          { id: 'home', icon: Home, label: 'Inicio' },
          { id: 'expenses', icon: PieChart, label: 'Gastos' },
          { id: 'yearly', icon: Calendar, label: 'Anual' },
          { id: 'debts', icon: CreditCard, label: 'Deudas' },
          { id: 'settings', icon: Settings, label: 'Más' }
        ].map(tab => (
          <div key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <tab.icon size={22} />
            <span style={{ fontSize: '0.65rem' }}>{tab.label}</span>
          </div>
        ))}
      </nav>

      {/* Modals */}
      <Modal isOpen={showAddFixed} onClose={() => setShowAddFixed(false)} title="Gasto Fijo">
        <form onSubmit={saveFixed}>
          <input type="text" name="name" className="input-field" placeholder="Nombre (Ej: Arriendo)" defaultValue={editingItem?.name} required style={{ marginBottom: '12px' }} />
          <input type="number" name="amount" className="input-field" placeholder="Monto" defaultValue={editingItem?.amount} required style={{ marginBottom: '12px' }} />
          <div className="input-group">
            <label className="input-label">Asignar a Periodo</label>
            <select name="period" className="input-field" defaultValue={editingItem?.period || selectedPeriod}>
              <option value="full">Todo el Mes</option>
              <option value="q1">1° Quincena</option>
              <option value="q2">2° Quincena</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <input type="checkbox" name="isSavings" id="isSavings" defaultChecked={editingItem?.isSavings} />
            <label htmlFor="isSavings">¿Es Ahorro?</label>
          </div>
          <button className="btn-primary" style={{ width: '100%' }}>Guardar</button>
        </form>
      </Modal>

      <Modal isOpen={showAddVar} onClose={() => setShowAddVar(false)} title="Gasto Variable">
        <form onSubmit={saveVar}>
          <input type="text" name="name" className="input-field" placeholder="Descripción" defaultValue={editingItem?.name} required style={{ marginBottom: '12px' }} />
          <input type="number" name="amount" className="input-field" placeholder="Monto" defaultValue={editingItem?.amount} required style={{ marginBottom: '12px' }} />
          <button className="btn-primary" style={{ width: '100%' }}>Guardar Gasto</button>
        </form>
      </Modal>

      <Modal isOpen={showAddDebt} onClose={() => setShowAddDebt(false)} title="Gestionar Deuda">
        <form onSubmit={saveDebt}>
          <input type="text" name="name" className="input-field" placeholder="Entidad / Nombre" defaultValue={editingItem?.name} required style={{ marginBottom: '12px' }} />
          <input type="number" name="total" className="input-field" placeholder="Monto Total" defaultValue={editingItem?.totalAmount} required style={{ marginBottom: '12px' }} />
          <input type="number" name="payment" className="input-field" placeholder="Cuota Mensual" defaultValue={editingItem?.monthlyPayment} required style={{ marginBottom: '12px' }} />
          <input type="number" name="remaining" className="input-field" placeholder="Saldo Pendiente" defaultValue={editingItem?.remaining} required style={{ marginBottom: '12px' }} />
          <button className="btn-primary" style={{ width: '100%' }}>Guardar Deuda</button>
        </form>
      </Modal>
    </div>
  );
}
