import React, { useState, useRef, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { FactoryIcon, LeafIcon, ChartBarIcon, CalendarIcon, BoxIcon } from '../components/Icons';

const Manufacturer = ({ labTestedBatches = [], manufacturedProducts = [], addManufacturedProduct, t }) => {
  const [searchBatchId, setSearchBatchId] = useState('');
  const [foundBatch, setFoundBatch] = useState(null);
  const [productName, setProductName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lotNumber, setLotNumber] = useState('');
  const qrCodeRef = useRef(null);

  // Stats
  const stats = useMemo(() => {
    const totalProducts = manufacturedProducts.length;
    const latestLot = manufacturedProducts.length > 0 ? manufacturedProducts[manufacturedProducts.length - 1].lotNumber : '-';
    return { totalProducts, latestLot };
  }, [manufacturedProducts]);

  useEffect(() => {
    if (isSubmitted && lotNumber && qrCodeRef.current) {
      const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}?product=${lotNumber}`;
      QRCode.toCanvas(qrCodeRef.current, url, { width: 200, margin: 2 }, (error) => {
        if (error) console.error(error);
      });
    }
  }, [isSubmitted, lotNumber]);

  const handleFindBatch = (e) => {
    e.preventDefault();
    setError('');
    const batch = labTestedBatches.find(b => b.batchId === searchBatchId && b.finalStatus === 'pass');
    if (batch) {
      setFoundBatch(batch);
    } else {
      const failedBatch = labTestedBatches.find(b => b.batchId === searchBatchId);
      if (failedBatch) {
        setError(t('batchFailedLabTestError', { batchId: searchBatchId }));
      } else {
        setError(t('passedBatchNotFound', { batchId: searchBatchId }));
      }
      setFoundBatch(null);
    }
  };

  const handleCreateLot = () => {
    if (productName && foundBatch) {
      const newLotNumber = `PROD-LOT-${Date.now().toString().slice(-6)}`;
      setLotNumber(newLotNumber);
      const newProduct = {
        productName,
        lotNumber: newLotNumber,
        ingredientBatch: foundBatch,
        timestamp: new Date().toISOString()
      };
      addManufacturedProduct(newProduct);
      setIsSubmitted(true);
    } else {
      setError(t('productNameError'));
    }
  };

  const resetForm = () => {
    setSearchBatchId('');
    setFoundBatch(null);
    setProductName('');
    setIsSubmitted(false);
    setLotNumber('');
    setError('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 bg-gradient-to-br from-amber-50 to-white border border-amber-100/50 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <FactoryIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Total Products</p>
            <p className="text-3xl font-bold text-slate-800">{stats.totalProducts}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 bg-gradient-to-br from-amber-50 to-white border border-amber-100/50 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <BoxIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Latest Lot</p>
            <p className="text-xl font-bold text-slate-800 truncate max-w-[150px]">{stats.latestLot}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 bg-gradient-to-br from-amber-50 to-white border border-amber-100/50 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Date</p>
            <p className="text-xl font-bold text-slate-800">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-8 rounded-3xl animate-fadeIn relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <FactoryIcon className="w-64 h-64 text-amber-900" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3 border-b border-brand-green/10 pb-4 relative z-10">
              <div className="bg-amber-100 p-2 rounded-xl text-amber-600 animate-float"><FactoryIcon className="w-6 h-6" /></div>
              {t('manufacturingHub')}
            </h3>

            {isSubmitted ? (
              <div className="bg-amber-50 p-10 rounded-3xl shadow-lg border-2 border-amber-100 text-center max-w-xl mx-auto animate-scaleIn relative z-10">
                <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                  <span className="text-4xl animate-float">🏭</span>
                </div>
                <h3 className="text-3xl font-bold text-amber-800 mb-4">{t('productLotCreated')}</h3>
                <p className="text-amber-900 mb-2 text-lg">{t('product')}: <span className="font-bold text-amber-700">{productName}</span></p>
                <p className="text-amber-800 mb-6">{t('lotNumber')}: <span className="font-mono bg-white border border-amber-200 px-3 py-1.5 rounded-lg text-amber-900 font-bold ml-2 shadow-sm">{lotNumber}</span></p>
                <div className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl border border-amber-200 shadow-sm w-fit mx-auto mb-6 animate-fadeIn delay-200">
                  <canvas ref={qrCodeRef}></canvas>
                </div>
                <p className="text-sm text-amber-600/80 mb-8 font-medium">{t('scanQrCodeConsumer')}</p>
                <button onClick={resetForm} className="glass-button font-bold py-3 px-8 rounded-full shadow-lg transform hover:-translate-y-1 hover:scale-105 active:scale-95 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 hover:shadow-amber-600/20">
                  {t('createAnotherLot')}
                </button>
              </div>
            ) : (
              <div className="relative z-10">
                {!foundBatch ? (
                  <form onSubmit={handleFindBatch} className="space-y-6 max-w-lg mx-auto bg-white/80 p-8 rounded-3xl shadow-sm border border-slate-100 animate-slideUp">
                    <div>
                      <label htmlFor="searchBatchIdMan" className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">{t('enterLabApprovedBatchId')}</label>
                      <div className="flex gap-3">
                        <input type="text" id="searchBatchIdMan" value={searchBatchId} onChange={e => setSearchBatchId(e.target.value)} className="input-modern w-full px-4 py-3" placeholder="FARM-BATCH-..." />
                        <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg shadow-amber-500/20 whitespace-nowrap hover:scale-105 active:scale-95">{t('find')}</button>
                      </div>
                    </div>
                    {error && <p className="text-red-500 text-sm text-center font-bold bg-red-50 py-3 rounded-xl border border-red-100 animate-shake">{error}</p>}
                  </form>
                ) : (
                  <div className="space-y-8 animate-slideUp">
                    <button onClick={() => setFoundBatch(null)} className="text-sm text-amber-600 hover:text-amber-800 font-bold mb-6 flex items-center gap-1 transition-colors hover:-translate-x-1 duration-200">
                      <span className="text-lg">←</span> {t('useAnotherBatch')}
                    </button>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 animate-fadeIn delay-100">
                      <h4 className="text-lg font-bold text-emerald-700 mb-4 flex items-center gap-2">
                        <LeafIcon className="w-5 h-5" />
                        {t('usingIngredientBatch')} <span className="font-mono bg-emerald-100 px-2 py-0.5 rounded text-emerald-800 ml-2">{foundBatch.batchId}</span>
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-6 items-start">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-grow w-full">
                          <p className="mb-2 flex justify-between"><strong className="text-slate-400 text-xs uppercase tracking-wide block">{t('herb')}</strong> <span className="text-lg font-bold text-slate-800">{foundBatch.herb}</span></p>
                          <p className="flex justify-between"><strong className="text-slate-400 text-xs uppercase tracking-wide block">{t('status')}</strong> <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200 uppercase tracking-wider">{t(foundBatch.finalStatus)}</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto animate-fadeIn delay-200">
                      <h4 className="text-lg font-bold text-amber-700 mb-6 text-center uppercase tracking-wide">{t('productDetails')}</h4>
                      <div className="mb-6">
                        <label htmlFor="productName" className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">{t('finalProductName')}</label>
                        <input type="text" id="productName" value={productName} onChange={e => setProductName(e.target.value)} className="input-modern w-full px-4 py-3" placeholder="e.g., Calming Ashwagandha Tincture" />
                      </div>

                      <button onClick={handleCreateLot} disabled={!productName} className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold py-4 px-6 rounded-2xl transition duration-300 transform hover:scale-[1.01] shadow-xl shadow-amber-600/20 disabled:bg-slate-300 disabled:text-slate-500 disabled:from-slate-300 disabled:to-slate-300 disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed text-lg flex items-center justify-center gap-2 active:scale-95">
                        <FactoryIcon className="w-5 h-5" /> {t('createProductLot')}
                      </button>
                      {error && <p className="text-red-500 text-sm text-center pt-4 font-bold animate-shake">{error}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: History Sidebar */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl bg-amber-50/50 sticky top-24">
            <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FactoryIcon className="w-5 h-5 text-amber-600" />
              Production History
            </h4>
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 scrollbar-thin">
              {manufacturedProducts.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <p>No products created yet.</p>
                </div>
              ) : (
                manufacturedProducts.slice().reverse().map((product, index) => (
                  <div key={index} className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-2 group relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-2 opacity-5">
                      <BoxIcon className="w-12 h-12 text-amber-900" />
                    </div>
                    <div className="flex justify-between items-start z-10">
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm mb-1">{product.productName}</h5>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 block w-fit">{product.lotNumber}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 z-10">
                      <span>Herb: {product.ingredientBatch ? product.ingredientBatch.herb : 'N/A'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manufacturer;
