import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { translations } from './utils/translations';
import { LogoutIcon, LeafIcon } from './components/Icons';
import RoleSelectionPage from './pages/RoleSelectionPage';
import RoleLoginPage from './pages/RoleLoginPage';
import Farmer from './pages/Farmer';
import Collector from './pages/Collector';
import Lab from './pages/Lab';
import Manufacturer from './pages/Manufacturer';
import Consumer from './pages/Consumer';

export default function App() {
    const [view, setView] = useState('role_selection');
    const [currentUser, setCurrentUser] = useState(null);
    const [roleToLogin, setRoleToLogin] = useState(null);
    const [language, setLanguage] = useState('en');
    const [initialLotNumber, setInitialLotNumber] = useState(null);

    // Data State
    const [harvestHistory, setHarvestHistory] = useState([]);
    const [collectedBatches, setCollectedBatches] = useState([]);
    const [labTestedBatches, setLabTestedBatches] = useState([]);
    const [manufacturedProducts, setManufacturedProducts] = useState([]);

    // Deep Linking Check
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const productParam = params.get('product');
        if (productParam) {
            setInitialLotNumber(productParam);
            setCurrentUser({ role: 'consumer', username: 'Guest' });
            setView('dashboard');
        }
    }, []);

    // Load Data from Backend (Database)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('/api/chain');
                const chain = res.data;
                const payloads = chain.map(block => block.payload).filter(p => p !== undefined);

                // Re-hydrate state from chain events
                const harvests = payloads.filter(p => p.type === 'HARVEST').map(p => p.data);
                const collections = payloads.filter(p => p.type === 'COLLECTION').map(p => p.data);
                const labTests = payloads.filter(p => p.type === 'QUALITY_TEST').map(p => p.data);
                const products = payloads.filter(p => p.type === 'MANUFACTURING').map(p => p.data);

                // For lab tests, we need to map the failure feedback back to harvests? 
                // The current state structure in App.js for harvestHistory includes labFeedback.
                // We'll simplisticly load what we have. Complex hydration might be needed for 'failed' feedback loop.
                // For now, let's load the raw lists.

                // Re-creating the lab feedback logic on load:
                const processedHarvests = harvests.map(h => {
                    // Find if any lab test failed for this batch
                    const failedTest = labTests.find(l => l.batchId === h.batchId && l.finalStatus === 'fail');
                    if (failedTest) {
                        return { ...h, labFeedback: { failedTests: failedTest.qualityTests.filter(t => t.status === 'fail') } };
                    }
                    return h;
                });

                setHarvestHistory(processedHarvests.reverse()); // Newest first
                setCollectedBatches(collections);
                setLabTestedBatches(labTests);
                setManufacturedProducts(products);

                console.log('Data loaded from Database');
            } catch (err) {
                console.error('Failed to load data from backend', err);
                // Fallback to localStorage if backend is down?
                // For now, let's stick to the DB plan.
            }
        };
        fetchData();
    }, []);

    // Removed localStorage effects to avoid conflict/double-source of truth.
    // Use API calls for mutations.

    const t = (key, params = {}) => {
        let text = translations[language][key] || key;
        Object.keys(params).forEach(param => {
            text = text.replace(`{{${param}}}`, params[param]);
        });
        return text;
    };

    const handleRoleSelect = (role) => {
        setRoleToLogin(role);
        setView('login');
    };

    const handleLogin = (userData) => {
        if (typeof userData === 'object' && userData !== null) {
            setCurrentUser({
                role: userData.role,
                username: userData.name || userData.username || 'User'
            });
        } else {
            setCurrentUser({ role: userData, username: 'DemoUser' });
        }
        setView('dashboard');
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setRoleToLogin(null);
        setInitialLotNumber(null);
        setView('role_selection');
        window.history.pushState({}, '', window.location.pathname);
    };

    const addHarvestToHistory = async (harvest) => {
        setHarvestHistory([harvest, ...harvestHistory]);
        try {
            await axios.post('/api/harvest', harvest);
        } catch (err) {
            console.error('Error saving harvest', err);
            // alert('Failed to save to database!'); // Suppress for smoother demo
        }
    };

    const addCollectedBatch = async (batch) => {
        setCollectedBatches([...collectedBatches, batch]);
        try {
            await axios.post('/api/collection', batch);
        } catch (err) {
            console.error('Error saving collection', err);
        }
    };

    const addLabTestedBatch = async (batch) => {
        setLabTestedBatches([...labTestedBatches, batch]);

        // Handle local state update for feedback
        if (batch.finalStatus === 'fail') {
            const updatedHarvests = harvestHistory.map(h => {
                if (h.batchId === batch.batchId) {
                    return { ...h, labFeedback: { failedTests: batch.qualityTests.filter(t => t.status === 'fail') } };
                }
                return h;
            });
            setHarvestHistory(updatedHarvests);
        }

        try {
            await axios.post('/api/quality', batch);
        } catch (err) {
            console.error('Error saving lab test', err);
        }
    };

    const addManufacturedProduct = async (product) => {
        setManufacturedProducts([...manufacturedProducts, product]);
        try {
            await axios.post('/api/processing', product);
        } catch (err) {
            console.error('Error saving product', err);
        }
    };

    const renderRoleDashboard = () => {
        switch (currentUser.role) {
            case 'farmer': return <Farmer harvestHistory={harvestHistory} addHarvestToHistory={addHarvestToHistory} t={t} />;
            case 'collector': return <Collector harvestHistory={harvestHistory} collectedBatches={collectedBatches} addCollectedBatch={addCollectedBatch} t={t} />;
            case 'lab': return <Lab collectedBatches={collectedBatches} labTestedBatches={labTestedBatches} addLabTestedBatch={addLabTestedBatch} t={t} language={language} />;
            case 'manufacturer': return <Manufacturer labTestedBatches={labTestedBatches} manufacturedProducts={manufacturedProducts} addManufacturedProduct={addManufacturedProduct} t={t} />;
            case 'consumer': return <Consumer manufacturedProducts={manufacturedProducts} t={t} initialLotNumber={initialLotNumber} />;
            default: return <div>Role not recognized.</div>;
        }
    };

    const renderView = () => {
        switch (view) {
            case 'role_selection':
                return <RoleSelectionPage onSelectRole={handleRoleSelect} t={t} />;
            case 'login':
                return <RoleLoginPage role={roleToLogin} onLogin={handleLogin} onBack={() => setView('role_selection')} t={t} />;
            case 'dashboard':
                return (
                    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
                        <header className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-4 z-40">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">{t(currentUser.role + 'Dashboard') || t(currentUser.role + 'Portal') || t('manufacturingHub')}</h2>
                                <p className="text-sm text-slate-500 font-medium">{t('loggedInAs')} <span className="text-brand-green font-bold">{currentUser.username}</span></p>
                            </div>
                            <div className="flex items-center gap-4">
                                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input-modern py-2.5 px-4 text-sm font-medium shadow-sm">
                                    <option value="en">English</option>
                                    <option value="kn">Kannada</option>
                                    <option value="mr">Marathi</option>
                                </select>
                                <button onClick={handleLogout} className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 px-5 py-2.5 rounded-xl transition-all font-bold text-sm shadow-sm hover:shadow-rose-500/10 border border-rose-100 hover:-translate-y-0.5 active:scale-95">
                                    <LogoutIcon className="w-4 h-4" /> {t('logout')}
                                </button>
                            </div>
                        </header>
                        <main>
                            {renderRoleDashboard()}
                        </main>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="bg-brand-gray text-brand-dark min-h-screen font-sans p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-brand-light/50 selection:bg-brand-green/30">
            {view === 'role_selection' && (
                <div className="absolute top-4 right-4 z-10 animate-fadeIn">
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="glass-panel py-2 px-4 rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-brand-green/50">
                        <option value="en">English</option>
                        <option value="kn">Kannada</option>
                        <option value="mr">Marathi</option>
                    </select>
                </div>
            )}
            <div className={`max-w-7xl mx-auto transition-all duration-500 ${view === 'role_selection' ? 'py-10' : ''}`}>
                {view === 'role_selection' && (
                    <header className="text-center mb-16 animate-slideDown">
                        <div className="inline-flex items-center justify-center p-4 bg-brand-green/10 rounded-2xl mb-6 shadow-sm">
                            <LeafIcon className="w-10 h-10 text-brand-green" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight mb-4">{t('appTitle')}</h1>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">{t('selectRolePrompt')}</p>
                    </header>
                )}
                {renderView()}
            </div>
            <footer className="mt-20 text-center text-slate-400 text-sm font-medium py-8">
                <p>&copy; 2025 Ayurvedic Traceability System. <span className="text-brand-green/60">{t('authenticityGuaranteed')}</span></p>
            </footer>
        </div>
    );
}