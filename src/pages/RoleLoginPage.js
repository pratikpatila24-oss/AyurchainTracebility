import React, { useState } from 'react';
import { UserIcon } from '../components/Icons';

const RoleLoginPage = ({ role, onLogin, onBack, t }) => {
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const roleConfigs = {
        farmer: { theme: 'emerald', iconColor: 'text-emerald-600', gradient: 'from-emerald-500 to-emerald-700' },
        collector: { theme: 'blue', iconColor: 'text-blue-600', gradient: 'from-blue-500 to-blue-700' },
        lab: { theme: 'purple', iconColor: 'text-purple-600', gradient: 'from-purple-500 to-purple-700' },
        manufacturer: { theme: 'amber', iconColor: 'text-amber-600', gradient: 'from-amber-500 to-amber-700' },
        consumer: { theme: 'teal', iconColor: 'text-teal-600', gradient: 'from-teal-500 to-teal-700' },
    };
    const config = roleConfigs[role] || roleConfigs.farmer;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!username || !password || (isSigningUp && !name)) {
            setError(t('fillAllFields'));
            return;
        }

        if (isSigningUp) {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            if (users[username]) {
                setError(t('userExists'));
                return;
            }
            users[username] = { password, role, name };
            localStorage.setItem('users', JSON.stringify(users));
            setIsSigningUp(false);
            setError('');
            alert(t('signupSuccess'));
        } else {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            const user = users[username];
            if (user && user.password === password && user.role === role) {
                onLogin(user);
            } else {
                setError(t('invalidCredentials'));
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slideUp">
            <div className="w-full max-w-md glass-panel p-10 rounded-3xl relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${config.gradient}`}></div>

                <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-full hover:bg-slate-50">
                    <span className="text-xl">←</span>
                </button>

                <div className="text-center mb-10 mt-4 animate-slideDown">
                    <div className={`inline-flex p-5 rounded-2xl bg-${config.theme}-50 mb-5 shadow-inner`}>
                        <UserIcon className={`h-10 w-10 ${config.iconColor}`} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">{isSigningUp ? t('createAccount') : t('welcomeBack')}</h2>
                    <p className={`text-xs font-bold uppercase tracking-widest text-${config.theme}-600 opacity-80`}>{t(role)} Portal</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {isSigningUp && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase">{t('fullName')}</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-modern w-full px-4 py-3 border-slate-200"
                                placeholder="John Doe"
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">{t('username')}</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input-modern w-full px-4 py-3 border-slate-200"
                            placeholder="username"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase">{t('password')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-modern w-full px-4 py-3 border-slate-200"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-shake border border-red-100">
                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">!</div>
                            {error}
                        </div>
                    )}

                    <button type="submit" className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl shadow-${config.theme}-500/20 bg-gradient-to-r ${config.gradient} hover:shadow-${config.theme}-500/30 transition-all transform hover:-translate-y-1 active:scale-[0.98]`}>
                        {isSigningUp ? t('signup') : t('login')}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-slate-50">
                    <p className="text-slate-500 text-sm">
                        {isSigningUp ? t('alreadyHaveAccount') : t('noAccount')}
                        <button onClick={() => { setIsSigningUp(!isSigningUp); setError(''); }} className={`font-bold ml-2 text-${config.theme}-600 hover:text-${config.theme}-700 underline decoration-2 underline-offset-2 decoration-transparent hover:decoration-current transition-all`}>
                            {isSigningUp ? t('login') : t('signup')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RoleLoginPage;
