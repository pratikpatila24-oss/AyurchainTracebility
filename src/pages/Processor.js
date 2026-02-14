import React from 'react';
import API from '../api'; 

// --- Helper for Hover State (Simulating :hover with inline styles) ---
function useHover() {
    const [hovered, setHovered] = React.useState(false);
    const eventHandlers = React.useMemo(() => ({
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false)
    }), []);
    return [hovered, eventHandlers];
}

// --- Processing Step Options ---
const PROCESSING_STEPS = ['Drying', 'Washing', 'Hulling', 'Roasting', 'Grinding', 'Packaging'];

// --- Modern Styling Constants (Using the same Green/Earthy Theme) ---
const styles = {
  container: {
    maxWidth: '480px', 
    padding: '35px 40px', 
    borderRadius: '20px', 
    // Card background is pure white, allowing global CSS to center it.
    background: '#ffffff', 
    boxShadow: '0 18px 45px rgba(0, 0, 0, 0.2)', 
    fontFamily: 'Poppins, sans-serif',
    position: 'relative', 
    overflow: 'hidden', 
    border: '1px solid #e0e0e0', 
  },
  header: {
    color: '#38761d', // Dark green header
    marginBottom: '30px',
    textAlign: 'center',
    fontSize: '2em', 
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  sectionTitle: {
    fontSize: '1.1em',
    fontWeight: '600',
    color: '#34495e',
    marginBottom: '15px',
    paddingBottom: '5px',
    borderBottom: '1px dashed #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  inputGroup: {
    marginBottom: '25px', 
  },
  label: {
    display: 'block',
    marginBottom: '10px',
    fontWeight: '600',
    color: '#555',
    fontSize: '0.95em',
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
      marginRight: '10px',
      color: '#6aa84f', // Primary green for icons
      fontSize: '1.1em',
  },
  input: {
    width: '100%',
    padding: '13px 15px',
    border: '1px solid #dcdcdc',
    borderRadius: '10px', 
    boxSizing: 'border-box',
    fontSize: '1em',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    backgroundColor: '#fff',
  },
  inputFocus: {
      borderColor: '#6aa84f',
      boxShadow: '0 0 8px rgba(106, 168, 79, 0.4)',
  },
  button: (color, isFullWidth = false, marginTop = '20px') => ({
    width: isFullWidth ? '100%' : 'auto',
    padding: '15px',
    backgroundColor: color,
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '1.1em',
    fontWeight: '700',
    marginTop: marginTop,
    transition: 'background-color 0.3s ease, transform 0.2s ease',
    minWidth: isFullWidth ? 'auto' : '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: `0 4px 10px ${color.replace('rgb', 'rgba').replace(')', ', 0.4)')}`,
  }),
  buttonHover: (color) => ({
      backgroundColor: color, 
      transform: 'translateY(-2px)',
      boxShadow: `0 6px 15px ${color.replace('rgb', 'rgba').replace(')', ', 0.5)')}`,
  }),
  buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
      boxShadow: 'none',
  },
  message: (isSuccess) => ({
    marginTop: '30px',
    padding: '18px',
    borderRadius: '12px',
    textAlign: 'center',
    backgroundColor: isSuccess ? '#eaf8e9' : '#ffebeb',
    color: isSuccess ? '#28a745' : '#d9534f',
    border: isSuccess ? '1px solid #d4edda' : '1px solid #f8d7da',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    fontSize: '0.95em',
  }),
};

// Component
export default function Processor(){
  const [batchId,setBatchId] = React.useState('');
  const [step,setStep] = React.useState(PROCESSING_STEPS[0]); // Default to Drying
  const [conditions,setConditions] = React.useState('Temp=35C, Humidity=60%');
  const [msg,setMsg] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const [batchIdFocused, setBatchIdFocused] = React.useState(false);
  const [conditionsFocused, setConditionsFocused] = React.useState(false);
  const [submitHovered, submitHoverHandlers] = useHover();
  
  const submit = async () => {
    if (!batchId || !step || !conditions) {
        setMsg('Error: All fields are required.');
        setIsSuccess(false);
        return;
    }
    
    setIsLoading(true);
    setMsg('Submitting processing step...');
    
    try{
      const res = await API.post('/processing',{ 
          batchId, 
          processorId: 'PROC001', 
          step, 
          conditions 
      });
      setMsg(`Processing step '${step}' recorded for Batch ID ${batchId}.`);
      setIsSuccess(true);
      setBatchId(''); // Clear batch ID on success
      // Keep step and conditions for rapid entry
    }catch(e){ 
        setMsg('Error: Failed to record processing step. Check Batch ID or network.');
        setIsSuccess(false); 
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.header}>
        <span style={styles.icon}>🏭</span>
        Processing Step Tracker
      </h3>
      
      {/* Batch ID Input Section */}
      <div style={styles.inputGroup}>
        <div style={styles.sectionTitle}>
            <span style={styles.icon}>#️⃣</span>Batch Identification
        </div>
        <label style={styles.label} htmlFor="batchId">
          Batch ID:
        </label>
        <input
          id="batchId"
          style={{
            ...styles.input,
            ...(batchIdFocused ? styles.inputFocus : {}),
          }}
          value={batchId}
          onChange={e => setBatchId(e.target.value)}
          placeholder="e.g., FARMER001-20231026-005"
          onFocus={() => setBatchIdFocused(true)}
          onBlur={() => setBatchIdFocused(false)}
          disabled={isLoading}
        />
      </div>

      {/* Step Select */}
      <div style={styles.inputGroup}>
        <div style={styles.sectionTitle}>
            <span style={styles.icon}>⚙️</span>Processing Details
        </div>
        
        <label style={styles.label} htmlFor="step">
          Processing Step:
        </label>
        <select
          id="step"
          style={styles.input}
          value={step}
          onChange={e => setStep(e.target.value)}
          disabled={isLoading}
        >
          {PROCESSING_STEPS.map(s => (
              <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Conditions Input */}
      <div style={styles.inputGroup}>
        <label style={styles.label} htmlFor="conditions">
          Conditions:
        </label>
        <input
          id="conditions"
          style={{
            ...styles.input,
            ...(conditionsFocused ? styles.inputFocus : {}),
          }}
          value={conditions}
          onChange={e => setConditions(e.target.value)}
          placeholder="e.g., Temp=35C, Duration=8h, Machine=A"
          onFocus={() => setConditionsFocused(true)}
          onBlur={() => setConditionsFocused(false)}
          disabled={isLoading}
        />
      </div>

      {/* Submit Button */}
      <button
        style={{
            ...styles.button('#38761d', true), 
            ...(isLoading ? styles.buttonDisabled : {}),
            ...(submitHovered ? styles.buttonHover('#275116') : {}), 
        }}
        onClick={submit}
        disabled={isLoading}
        {...submitHoverHandlers}
      >
        {isLoading ? (
            <>
                <span style={styles.icon}>⏳</span>
                Recording Step...
            </>
        ) : (
            <>
                <span style={styles.icon}>➡️</span>
                Submit Step Record
            </>
        )}
      </button>

      {/* Message Feedback */}
      {msg && (
        <div style={styles.message(isSuccess)}>
          {isSuccess ? <span style={styles.icon}>🎉</span> : <span style={styles.icon}>⚠️</span>}
          {msg}
        </div>
      )}
    </div>
  );
}