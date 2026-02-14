import React, { useEffect, useRef, useState } from 'react';
import { LeafIcon, BoxIcon, FlaskConicalIcon, FactoryIcon, UserIcon } from '../components/Icons';
import farmerImg from '../assets/images/farmer.png';
import collectorImg from '../assets/images/collector.png';
import labImg from '../assets/images/lab.png';
import manufacturerImg from '../assets/images/manufacturer.png';
import consumerImg from '../assets/images/consumer.png';

const FadeSection = ({ children, delay = 0 }) => {
    const [isVisible, setVisible] = useState(false);
    const domRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => setVisible(entry.isIntersecting));
        });
        if (domRef.current) observer.observe(domRef.current);
        return () => {
            if (domRef.current) observer.unobserve(domRef.current);
        };
    }, []);

    return (
        <div
            ref={domRef}
            className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

const RoleSelectionPage = ({ onSelectRole, t }) => {
    const roles = [
        {
            key: 'farmer',
            label: t('farmer'),
            Icon: LeafIcon,
            image: farmerImg,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
            description: 'The foundation of purity. Register crops, manage harvests, and ensure every herb starts its journey with transparency.'
        },
        {
            key: 'collector',
            label: t('collector'),
            Icon: BoxIcon,
            image: collectorImg,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            buttonBg: 'bg-blue-600 hover:bg-blue-700',
            description: 'The bridge to the market. Verify farmer data, aggregate batches, and manage the logistics of transport with precision.'
        },
        {
            key: 'lab',
            label: t('lab'),
            Icon: FlaskConicalIcon,
            image: labImg,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            buttonBg: 'bg-purple-600 hover:bg-purple-700',
            description: 'The seal of quality. Conduct rigorous testing on batches and upload results to the blockchain, certifying safety and potency.'
        },
        {
            key: 'manufacturer',
            label: t('manufacturer'),
            Icon: FactoryIcon,
            image: manufacturerImg,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            buttonBg: 'bg-amber-600 hover:bg-amber-700',
            description: 'The creators of wellness. Process raw approved ingredients into finished products and generate trackable QR codes for consumers.'
        },
        {
            key: 'consumer',
            label: t('consumer'),
            Icon: UserIcon,
            image: consumerImg,
            color: 'text-teal-600',
            bg: 'bg-teal-50',
            buttonBg: 'bg-teal-600 hover:bg-teal-700',
            description: 'The empowered user. Scan product QR codes to instantly trace the entire journey of your ayurvedic medicine from soil to shelf.'
        },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 pb-20">
            <div className="space-y-24">
                {roles.map((role, index) => (
                    <FadeSection key={role.key}>
                        <div
                            className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-10 lg:gap-20`}
                        >
                            <div className="w-full lg:w-1/2 relative group">
                                <div className={`absolute -inset-4 ${role.bg.replace('50', '200')} rounded-[2rem] transform rotate-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                                <img
                                    src={role.image}
                                    alt={`${role.label} Role`}
                                    className="relative rounded-[2rem] shadow-2xl w-full h-[400px] object-cover transform transition-transform duration-500 group-hover:scale-[1.02]"
                                />
                                <div className={`absolute bottom-6 right-6 p-4 rounded-2xl glass-panel ${role.color} backdrop-blur-md shadow-lg border border-white/50`}>
                                    <role.Icon className="w-8 h-8" />
                                </div>
                            </div>

                            <div className="w-full lg:w-1/2 text-center lg:text-left space-y-6">
                                <h2 className={`text-4xl lg:text-5xl font-bold ${role.color} tracking-tight`}>{role.label}</h2>
                                <p className="text-xl text-slate-600 leading-relaxed font-medium max-w-lg mx-auto lg:mx-0">
                                    {role.description}
                                </p>
                                <button
                                    onClick={() => onSelectRole(role.key)}
                                    className={`${role.buttonBg} text-white font-bold text-lg py-4 px-10 rounded-full shadow-xl shadow-slate-300/50 hover:shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3 mx-auto lg:mx-0`}
                                >
                                    Enter {role.label} Portal <span className="text-xl">→</span>
                                </button>
                            </div>
                        </div>
                    </FadeSection>
                ))}
            </div>

            <FadeSection delay={200}>
                <div className="mt-32 border-t border-slate-200 pt-16 text-center max-w-4xl mx-auto">
                    <h3 className="text-3xl font-bold text-slate-800 mb-6">About the Ayurvedic Traceability System</h3>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        We believe in the power of transparency. By connecting farmers, collectors, labs, manufacturers, and consumers on a single unified platform, we ensure that every drop of medicine is authentic, safe, and ethically sourced.
                    </p>
                </div>
            </FadeSection>
        </div>
    );
};
export default RoleSelectionPage;
