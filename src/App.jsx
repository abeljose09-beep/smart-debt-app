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
  Save,
  User,
  LogOut,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot 
} from 'firebase/firestore';

// --- Utils ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount);
};

// --- Components ---

const Card = ({ children, title, subtitle, icon: Icon }) => (
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // login | register
  const [activeTab, setActiveTab] = useState('home');
  
  // -- App States --
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedPeriod, setSelectedPeriod] = useState('full');
  
  const [profile, setProfile] = useState({ salary: 2500000, frequency: 'monthly' });
  const [userName, setUserName] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [variableExpenses, setVariableExpenses] = useState([]);
  const [debts, setDebts] = useState([]);

  // -- UI States --
  const [showAddFixed, setShowAddFixed] = useState(false);
  const [showAddVar, setShowAddVar] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState('');

  // --- Firebase Auth ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // --- sync with Firestore ---
  useEffect(() => {
    if (!user) return;

    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setProfile(data.profile || { salary: 2500000, frequency: 'monthly' });
        setUserName(data.name || '');
      }
    });

    const unsubData = onSnapshot(doc(db, 'data', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setFixedExpenses(data.fixedExpenses || []);
        setVariableExpenses(data.variableExpenses || []);
        setDebts(data.debts || []);
      }
    });

    return () => {
      unsubProfile();
      unsubData();
    };
  }, [user]);

  const updateFirestore = async (newData) => {
    if (!user) return;
    await setDoc(doc(db, 'data', user.uid), newData, { merge: true });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.target);
    const email = fd.get('email');
    const password = fd.get('password');

    try {
      if (authMode === 'register') {
        const name = fd.get('name');
        const phone = fd.get('phone');
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', res.user.uid), {
          name, phone, email,
          profile: { salary: 2500000, frequency: 'monthly' }
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError('Error en la autenticación: ' + err.message);
    }
  };

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
  const saveFixed = async (e) => {
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
    const newList = editingItem ? fixedExpenses.map(i => i.id === item.id ? item : i) : [...fixedExpenses, item];
    await updateFirestore({ fixedExpenses: newList });
    setShowAddFixed(false);
  };

  const saveVar = async (e) => {
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
    const newList = editingItem ? variableExpenses.map(i => i.id === item.id ? item : i) : [...variableExpenses, item];
    await updateFirestore({ variableExpenses: newList });
    setShowAddVar(false);
  };

  const saveDebt = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const item = {
      id: editingItem?.id || Date.now(),
      name: fd.get('name'),
      totalAmount: Number(fd.get('total')),
      monthlyPayment: Number(fd.get('payment')),
      remaining: Number(fd.get('remaining')),
      payments: editingItem?.payments || []
    };
    const newList = editingItem ? debts.map(i => i.id === item.id ? item : i) : [...debts, item];
    await updateFirestore({ debts: newList });
    setShowAddDebt(false);
  };

  const savePayment = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    const fd = new FormData(e.target);
    const paymentAmount = Number(fd.get('amount'));
    
    const payment = {
      id: Date.now(),
      amount: paymentAmount,
      date: new Date().toISOString().split('T')[0],
      monthYear: currentMonthYear
    };

    const updatedDebts = debts.map(debt => {
      if (debt.id === editingItem.id) {
        return {
          ...debt,
          remaining: debt.remaining - paymentAmount,
          payments: [...(debt.payments || []), payment]
        };
      }
      return debt;
    });

    await updateFirestore({ debts: updatedDebts });
    setShowAddPayment(false);
    setEditingItem(null);
  };

  const deleteItem = async (id, type) => {
    let newList;
    if (type === 'fixed') {
      newList = fixedExpenses.filter(i => i.id !== id);
      await updateFirestore({ fixedExpenses: newList });
    } else if (type === 'var') {
      newList = variableExpenses.filter(i => i.id !== id);
      await updateFirestore({ variableExpenses: newList });
    } else if (type === 'debt') {
      newList = debts.filter(i => i.id !== id);
      await updateFirestore({ debts: newList });
    }
  };

  // --- Views ---

  const AuthView = () => (
    <div className="scroll-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '360px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>{authMode === 'login' ? 'Bienvenido' : 'Crear Cuenta'}</h2>
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '16px' }}>{error}</p>}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {authMode === 'register' && (
            <>
              <input type="text" name="name" className="input-field" placeholder="Nombre completo" required />
              <input type="tel" name="phone" className="input-field" placeholder="Teléfono" required />
            </>
          )}
          <input type="email" name="email" className="input-field" placeholder="Email" required />
          <input type="password" name="password" className="input-field" placeholder="Contraseña" required />
          <button className="btn-primary" type="submit">{authMode === 'login' ? 'Entrar' : 'Registrarse'}</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {authMode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', marginLeft: '8px', cursor: 'pointer' }}>
            {authMode === 'login' ? 'Regístrate' : 'Entra'}
          </button>
        </p>
      </div>
    </div>
  );

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
        {debts.map(debt => {
          const progress = ((debt.totalAmount - debt.remaining) / debt.totalAmount) * 100;
          return (
            <motion.div key={debt.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontWeight: '700' }} onClick={() => { setEditingItem(debt); setShowAddDebt(true); }}>{debt.name}</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => { setEditingItem(debt); setShowAddPayment(true); }}>
                    Abonar
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteItem(debt.id, 'debt'); }} style={{ background: 'none', border: 'none', color: 'var(--danger)' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="grid-2" style={{ marginBottom: '16px' }}>
                <div><p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Faltante</p><p className="currency" style={{ fontWeight: '700' }}>{formatCurrency(debt.remaining)}</p></div>
                <div><p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Cuota Sugerida</p><p className="currency" style={{ color: 'var(--danger)' }}>{formatCurrency(debt.monthlyPayment)}</p></div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '6px', background: 'var(--surface-color)', borderRadius: '3px', marginBottom: '8px' }}>
                <div style={{ width: `${Math.min(100, Math.max(0, progress))}%`, height: '100%', background: 'var(--accent-color)', borderRadius: '3px', transition: 'width 0.5s ease-out' }}></div>
              </div>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{Math.round(progress)}% pagado</p>
              
              {debt.payments && debt.payments.length > 0 && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '8px' }}>Últimos Abonos</p>
                  {debt.payments.slice(-3).reverse().map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px', opacity: 0.8 }}>
                      <span>{p.date}</span>
                      <span style={{ color: 'var(--success)' }}>+{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const SettingsView = () => {
    const [tempSalary, setTempSalary] = useState(profile.salary);
    const handleSaveProfile = async () => {
      await setDoc(doc(db, 'users', user.uid), { profile: { ...profile, salary: tempSalary } }, { merge: true });
    };

    return (
      <div className="scroll-area">
        <h2 style={{ marginBottom: '24px' }}>Ajustes</h2>
        <Card title="Perfil Financiero" icon={Settings}>
          <div className="input-group">
            <label className="input-label">Monto de Sueldo</label>
            <input type="number" className="input-field" value={tempSalary} onChange={(e) => setTempSalary(Number(e.target.value))} />
          </div>
          <div className="input-group">
            <label className="input-label">Frecuencia</label>
            <select className="input-field" value={profile.frequency} onChange={(e) => setProfile({...profile, frequency: e.target.value})}>
              <option value="monthly">Mensual</option>
              <option value="quincenal">Quincenal</option>
            </select>
          </div>
          <button className="btn-primary" onClick={handleSaveProfile} style={{ width: '100%' }}>Guardar Cambios</button>
        </Card>
        <button className="btn-secondary" style={{ width: '100%', marginTop: 'auto', color: 'var(--danger)' }} onClick={() => signOut(auth)}>
          <LogOut size={18} style={{ marginRight: '8px' }} /> Cerrar Sesión
        </button>
      </div>
    );
  };

  if (loading) return null;
  if (!user) return <AuthView />;

  return (
    <div className="app-container">
      <header className="header">
        <h2 style={{ fontWeight: '800' }}>SmartDebt</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
            Hola, {userName.split(' ')[0] || '!'}
          </span>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-color), #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
            <User size={18} color="white" />
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab + selectedMonth + selectedPeriod} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'home' && <HomeView />}
          {activeTab === 'expenses' && <ExpensesView />}
          {activeTab === 'debts' && <DebtsView />}
          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'yearly' && <div className="scroll-area"><Card title="Proyección 2024">🚧 Próximamente en la nube...</Card></div>}
        </motion.div>
      </AnimatePresence>

      <nav className="nav-bar">
        {[
          { id: 'home', icon: Home, label: 'Inicio' },
          { id: 'expenses', icon: PieChart, label: 'Gastos' },
          { id: 'debts', icon: CreditCard, label: 'Deudas' },
          { id: 'settings', icon: Settings, label: 'Perfil' }
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
          <input type="text" name="name" className="input-field" placeholder="Nombre" defaultValue={editingItem?.name} required style={{ marginBottom: '12px' }} />
          <input type="number" name="amount" className="input-field" placeholder="Monto" defaultValue={editingItem?.amount} required style={{ marginBottom: '12px' }} />
          <div className="input-group">
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
          <button className="btn-primary" style={{ width: '100%' }}>Guardar</button>
        </form>
      </Modal>

      <Modal isOpen={showAddDebt} onClose={() => setShowAddDebt(false)} title="Deuda">
        <form onSubmit={saveDebt}>
          <input type="text" name="name" className="input-field" placeholder="Nombre (Ej: Banco)" defaultValue={editingItem?.name} required style={{ marginBottom: '12px' }} />
          <input type="number" name="total" className="input-field" placeholder="Monto Inicial" defaultValue={editingItem?.totalAmount} required style={{ marginBottom: '12px' }} />
          <input type="number" name="payment" className="input-field" placeholder="Cuota Mensual" defaultValue={editingItem?.monthlyPayment} required style={{ marginBottom: '12px' }} />
          <input type="number" name="remaining" className="input-field" placeholder="Saldo Actual" defaultValue={editingItem?.remaining} required style={{ marginBottom: '12px' }} />
          <button className="btn-primary" style={{ width: '100%' }}>Guardar</button>
        </form>
      </Modal>

      <Modal isOpen={showAddPayment} onClose={() => setShowAddPayment(false)} title={`Abonar a ${editingItem?.name}`}>
        <form onSubmit={savePayment}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Registra un pago para reducir el saldo pendiente.</p>
          <input type="number" name="amount" className="input-field" placeholder="Monto del Abono" defaultValue={editingItem?.monthlyPayment} required style={{ marginBottom: '20px' }} />
          <button className="btn-primary" style={{ width: '100%' }}>Confirmar Pago</button>
        </form>
      </Modal>
    </div>
  );
}
