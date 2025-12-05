
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { evaluateExpression, factorial, formatResult } from './utils/math';
import { convertCurrency, getExchangeRate, fetchExchangeRates, CURRENCY_NAMES, CURRENCY_SYMBOLS, CURRENCY_FLAGS, DEFAULT_EXCHANGE_RATES } from './utils/currency';
import { UNITS, UNIT_CATEGORIES, convertUnit, getConversionRate, UnitCategory } from './utils/units';
import Display from './components/Display';
import CalculatorButton from './components/CalculatorButton';
import HistoryPanel from './components/HistoryPanel';
import AIResponsePanel from './components/AIResponsePanel';
import { CalculatorMode, AngleMode } from './types';

// Define the shape of a calculator state snapshot
interface CalculatorState {
  expression: string;
  displayValue: string;
  overwrite: boolean;
  openParenCount: number;
}

/**
 * Main Activity/Component for the Calculator App.
 * Handles all state management, UI layout, and interaction logic.
 */
const App: React.FC = () => {
  // --- State Management ---
  const [expression, setExpression] = useState<string>('');
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [overwrite, setOverwrite] = useState<boolean>(true);
  const [mode, setMode] = useState<CalculatorMode>('simple');
  const [openParenCount, setOpenParenCount] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [angleMode, setAngleMode] = useState<AngleMode>('deg');

  // --- Undo/Redo State ---
  const [undoStack, setUndoStack] = useState<CalculatorState[]>([]);
  const [redoStack, setRedoStack] = useState<CalculatorState[]>([]);

  // --- Currency State ---
  const [currencyFrom, setCurrencyFrom] = useState<string>('USD');
  const [currencyTo, setCurrencyTo] = useState<string>('EUR');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(DEFAULT_EXCHANGE_RATES);
  const [ratesLoaded, setRatesLoaded] = useState(false);

  // --- Unit Converter State ---
  const [unitCategory, setUnitCategory] = useState<UnitCategory>('length');
  const [unitFrom, setUnitFrom] = useState<string>('m');
  const [unitTo, setUnitTo] = useState<string>('ft');

  // --- AI Integration State ---
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  // Helper to identify error states
  const isError = (val: string) => ['Error', "Can't divide by 0", 'Invalid Input', 'Format Error'].includes(val);

  // --- Effect: Fetch Rates ---
  useEffect(() => {
    const loadRates = async () => {
      const freshRates = await fetchExchangeRates();
      if (freshRates) {
        // Merge fresh rates with defaults to ensure we have at least the keys we expect, 
        // though the API usually covers them.
        setExchangeRates(prev => ({ ...prev, ...freshRates }));
        setRatesLoaded(true);
      }
    };
    loadRates();
  }, []);

  // --- Undo/Redo Logic ---
  const saveState = () => {
    const currentState: CalculatorState = {
      expression,
      displayValue,
      overwrite,
      openParenCount
    };
    
    setUndoStack(prev => {
      const newStack = [currentState, ...prev];
      // Limit stack size to 50 to prevent memory issues over long sessions
      return newStack.slice(0, 50);
    });
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const previousState = undoStack[0];
    const currentState: CalculatorState = {
      expression,
      displayValue,
      overwrite,
      openParenCount
    };

    setRedoStack(prev => [currentState, ...prev]);
    setUndoStack(prev => prev.slice(1));

    // Restore state
    setExpression(previousState.expression);
    setDisplayValue(previousState.displayValue);
    setOverwrite(previousState.overwrite);
    setOpenParenCount(previousState.openParenCount);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[0];
    const currentState: CalculatorState = {
      expression,
      displayValue,
      overwrite,
      openParenCount
    };

    setUndoStack(prev => [currentState, ...prev]);
    setRedoStack(prev => prev.slice(1));

    // Restore state
    setExpression(nextState.expression);
    setDisplayValue(nextState.displayValue);
    setOverwrite(nextState.overwrite);
    setOpenParenCount(nextState.openParenCount);
  };

  // --- Logic Handlers ---
  const handleHistoryItemClick = (entry: string) => {
    saveState(); // Save before loading history
    const result = entry.split(' = ')[1];
    if (result) {
        setDisplayValue(result);
        setExpression('');
        setOverwrite(true);
        setShowHistory(false);
    }
  };

  const handleClearHistory = () => {
      setHistory([]);
  };

  const handlePaste = (text: string): boolean => {
    // Prevent pasting if in error state, forcing user to clear first
    if (isError(displayValue)) return false;

    // Remove commas and sanitize
    const sanitized = text.replace(/,/g, '').trim();
    
    // Check if it's a valid number (allowing scientific notation e.g. 1.2e5) or fraction
    // Simple fraction check: digits/digits
    if ((!isNaN(Number(sanitized)) || /^\d+\/\d+$/.test(sanitized)) && sanitized !== '') {
        saveState(); // Save before paste
        setDisplayValue(sanitized);
        setOverwrite(false); // Allow user to append/edit after pasting
        return true;
    }
    return false;
  };

  const handleAICheck = async () => {
    setAiPanelOpen(true);
    setIsThinking(true);
    setAiResponse('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let promptText = '';
      if (mode === 'currency') {
         promptText = `I am converting ${displayValue} ${currencyFrom} to ${currencyTo}. The exchange rate I'm using is roughly ${getExchangeRate(currencyFrom, currencyTo, exchangeRates).toFixed(4)}. Can you confirm if this is accurate for today, and tell me a little bit about the history of the ${CURRENCY_NAMES[currencyTo]}?`;
      } else if (expression && displayValue && !isError(displayValue)) {
          promptText = `I am currently calculating the following expression: "${expression}${displayValue}". Please verify this calculation, explain the steps to solve it, and provide the final result.`;
      } else if (history.length > 0 && (displayValue === '0' || overwrite)) {
          promptText = `I just calculated: "${history[0]}". Please check if this result is correct and explain the mathematical steps taken to get there in a simple, clear way.`;
      } else if (!isError(displayValue)) {
          promptText = `I have the number "${displayValue}" on my calculator display. Please tell me an interesting mathematical fact or property about this number.`;
      } else {
        setAiResponse("I cannot analyze an error state. Please enter a valid expression.");
        setIsThinking(false);
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
      });

      setAiResponse(response.text || "No explanation could be generated.");
    } catch (error) {
      console.error("AI Error:", error);
      setAiResponse("Sorry, I couldn't connect to the AI service. Please check your internet connection or API key configuration.");
    } finally {
      setIsThinking(false);
    }
  };

  // Modified to only toggle between Simple and Scientific
  // If in Currency mode, it acts as a "Back to Calculator" button (defaulting to Simple)
  const handleModeToggle = () => {
    if (mode === 'simple') setMode('scientific');
    else setMode('simple');
  };

  // Dedicated handler for Currency Mode toggle
  const handleCurrencyToggle = () => {
    if (mode === 'currency') {
      setMode('simple'); // Toggle off -> go to simple
    } else {
      setMode('currency'); // Toggle on
    }
  };

  // Dedicated handler for Units Mode toggle
  const handleUnitsToggle = () => {
    if (mode === 'units') {
      setMode('simple'); // Toggle off -> go to simple
    } else {
      setMode('units'); // Toggle on
    }
  };

  const handleSwapCurrency = () => {
    setCurrencyFrom(currencyTo);
    setCurrencyTo(currencyFrom);
  };

  const handleSwapUnits = () => {
    setUnitFrom(unitTo);
    setUnitTo(unitFrom);
  };

  const handleCategoryChange = (category: UnitCategory) => {
    setUnitCategory(category);
    const units = Object.keys(UNITS[category]);
    setUnitFrom(units[0]);
    setUnitTo(units[1] || units[0]);
  };

  const handleButtonClick = (value: string) => {
    // STRICT ERROR HANDLING:
    // If an error is displayed, ONLY allow 'AC' to clear it.
    // All other inputs are ignored until the user resets the calculator.
    if (isError(displayValue) && value !== 'AC') {
      return;
    }

    if (value === 'DEG' || value === 'RAD') {
      setAngleMode(prev => prev === 'deg' ? 'rad' : 'deg');
      return;
    }

    // Save state before any modification
    saveState();

    switch (value) {
      case 'AC':
        setExpression('');
        setDisplayValue('0');
        setOverwrite(true);
        setOpenParenCount(0);
        break;
      case 'DEL':
        if (displayValue !== '0') {
            let newValue = displayValue.slice(0, -1);
            if (newValue === '' || newValue === '-') {
                newValue = '0';
            }
            setDisplayValue(newValue);
            if (newValue === '0') {
                setOverwrite(true);
            }
        }
        break;
      case '+/-':
        if (displayValue === '0') return;
        if (displayValue.startsWith('-')) {
            setDisplayValue(displayValue.substring(1));
        } else {
            setDisplayValue('-' + displayValue);
        }
        break;
      case '=':
        let finalExpression = expression + displayValue;
        if (openParenCount > 0) {
          finalExpression += ')'.repeat(openParenCount);
          setOpenParenCount(0);
        }
        const result = evaluateExpression(finalExpression, angleMode);
        
        // Format the result (handle fractions, errors)
        const formattedResult = formatResult(result);
        
        // Only add to history if it's a valid result (not an error string like "Invalid Input")
        if (!isError(formattedResult)) {
            const newHistoryEntry = `${finalExpression.replace(/\s/g, '')} = ${formattedResult}`;
            setHistory(prevHistory => [newHistoryEntry, ...prevHistory]);
        }
        
        setDisplayValue(formattedResult);
        setExpression('');
        setOverwrite(true);
        break;
      case '%':
        const percentVal = parseFloat(displayValue);
        if (isNaN(percentVal)) break;
        if (expression.trim() === '') {
            setDisplayValue(String(percentVal / 100));
            setOverwrite(true);
            break;
        }
        const trimmedExpression = expression.trim();
        const op = trimmedExpression.slice(-1);
        const baseExpr = trimmedExpression.slice(0, -1).trim();

        if (!['+', '-', '×', '÷'].includes(op)) {
            setDisplayValue(String(percentVal / 100));
            setOverwrite(true);
            break;
        }
        const baseValueResult = evaluateExpression(baseExpr, angleMode);
        // If evaluateExpression returns a string, it's an error message
        if (typeof baseValueResult === 'string') {
            setDisplayValue(baseValueResult);
            setExpression('');
            setOverwrite(true);
            break;
        }
        const baseValue = Number(baseValueResult);
        let percentResult;
        if (op === '+' || op === '-') {
            const percentageAmount = (percentVal / 100) * baseValue;
            percentResult = op === '+' ? baseValue + percentageAmount : baseValue - percentageAmount;
        } else if (op === '×' || op === '÷') {
            const percentageDecimal = percentVal / 100;
            percentResult = op === '×' ? baseValue * percentageDecimal : baseValue / percentageDecimal;
        }
        if (percentResult !== undefined) {
            // Updated to use formatResult for consistency with standard result formatting
            const resultString = formatResult(percentResult);
            const fullOriginalExpression = `${baseExpr} ${op} ${displayValue}%`;
            const newHistoryEntry = `${fullOriginalExpression.replace(/\s/g, '')} = ${resultString}`;
            setHistory(prevHistory => [newHistoryEntry, ...prevHistory]);
            setDisplayValue(resultString);
            setExpression('');
            setOverwrite(true);
            setOpenParenCount(0);
        }
        break;
      case '+':
      case '-':
      case '×':
      case '÷':
      case 'xʸ':
        const operator = value === 'xʸ' ? '^' : value;
        const currentExpression = expression + displayValue;
        if (/\s[+\-×÷^]\s$/.test(currentExpression)) {
           setExpression(currentExpression.slice(0, -3) + ` ${operator} `);
        } else {
           setExpression(currentExpression + ` ${operator} `);
        }
        setOverwrite(true);
        break;
      case '.':
        if (!displayValue.includes('.')) {
          if (overwrite) {
            setDisplayValue('0.');
            setOverwrite(false);
          } else {
            setDisplayValue(displayValue + '.');
          }
        }
        break;
      case 'sin':
      case 'cos':
      case 'tan':
      case 'csc':
      case 'sec':
      case 'cot':
      case 'log':
      case 'ln':
      case '√':
      case '|x|':
        const prefix = displayValue.replace(/^0+/, '');
        // Map button labels to internal math function names
        const funcMap: Record<string, string> = { 
            '√': '√', 
            '|x|': 'abs'
        };
        const funcName = funcMap[value] || value;
        
        setExpression(expression + (expression ? '' : '') + prefix + `${funcName}(`);
        setOpenParenCount(prev => prev + 1);
        setOverwrite(true);
        break;
      case '!':
        // Calculate factorial immediately for the current number
        const num = parseFloat(displayValue);
        if (isNaN(num)) {
            setDisplayValue('Invalid Input');
        } else {
            const result = factorial(num);
            if (!isFinite(result) || isNaN(result)) {
               setDisplayValue('Invalid Input');
            } else {
               setDisplayValue(String(result));
            }
        }
        setOverwrite(true);
        break;
      case 'x²':
        // Wrap negative numbers in parentheses to ensure correct squaring: -5 -> (-5)^2
        const valToSquare = displayValue.startsWith('-') ? `(${displayValue})` : displayValue;
        setExpression(expression + valToSquare + '^2');
        setOverwrite(true);
        break;
      case '1/x':
        const val = parseFloat(displayValue);
        if (val === 0) {
            setDisplayValue("Can't divide by 0");
            setOverwrite(true);
        } else if (!isNaN(val)) {
            // Attempt to display fraction for reciprocal if it makes sense (e.g. 1/0.5 = 2, 1/3 = 1/3)
            // But usually 1/x is an immediate operation. 
            // We use standard division result here.
            setDisplayValue(formatResult(1 / val));
            setOverwrite(true);
        }
        break;
      case '(':
        if (overwrite) {
          setExpression(expression + '(');
        } else {
          setExpression(expression + displayValue.replace(/^0+/, '') + '*(');
        }
        setOpenParenCount(prev => prev + 1);
        setOverwrite(true);
        break;
      case ')':
        if (openParenCount > 0) {
          setExpression(expression + displayValue + ')');
          setOpenParenCount(prev => prev - 1);
          setOverwrite(true);
        }
        break;
      case 'π':
      case 'e':
      case 'φ':
        let constant = '';
        if (value === 'π') constant = String(Math.PI);
        else if (value === 'e') constant = String(Math.E);
        else if (value === 'φ') constant = String((1 + Math.sqrt(5)) / 2);
        setDisplayValue(constant);
        setOverwrite(true);
        break;
      default:
        // Number input
        if (overwrite) {
          setDisplayValue(value);
          setOverwrite(false);
        } else {
          setDisplayValue(displayValue === '0' ? value : displayValue + value);
        }
        break;
    }
  };

  // UI Styling Constants
  const specialButtonClass = "bg-gray-400 text-black hover:bg-gray-300 rounded-2xl";
  const operatorButtonClass = "bg-orange-500 hover:bg-orange-600 text-white rounded-2xl";
  const numberButtonClass = "bg-gray-800 hover:bg-gray-700 rounded-2xl";
  
  // Scientific Mode Button Configuration
  const sciOpButtonClass = "bg-gray-700 hover:bg-gray-600 text-white rounded-2xl shadow-sm";
  const sciFnButtonClass = "bg-gray-600 hover:bg-gray-500 text-white rounded-2xl shadow-sm";
  const sciConstButtonClass = "bg-gray-500 hover:bg-gray-400 text-white rounded-2xl shadow-sm";

  const scientificButtons = [
    { label: 'sin', className: sciFnButtonClass },
    { label: 'cos', className: sciFnButtonClass },
    { label: 'tan', className: sciFnButtonClass },
    { label: angleMode.toUpperCase(), className: sciConstButtonClass },
    
    // Reciprocal trig functions: csc = 1/sin, sec = 1/cos, cot = 1/tan
    { label: 'csc', className: sciFnButtonClass },
    { label: 'sec', className: sciFnButtonClass },
    { label: 'cot', className: sciFnButtonClass },
    { label: 'π', className: sciConstButtonClass },
    
    { label: 'ln', className: sciFnButtonClass },
    { label: 'log', className: sciFnButtonClass },
    { label: 'e', className: sciConstButtonClass },
    { label: '1/x', className: sciFnButtonClass },
    
    { label: 'x²', className: sciFnButtonClass },
    { label: 'xʸ', className: sciFnButtonClass },
    { label: '√', className: sciFnButtonClass },
    { label: '|x|', className: sciFnButtonClass },
    
    { label: '(', className: sciOpButtonClass },
    { label: ')', className: sciOpButtonClass },
    { label: '!', className: sciOpButtonClass },
    { label: 'φ', className: sciConstButtonClass },
  ];

  // Currency Conversion Calculation
  // We use the current display value (input) as the source amount
  // We must parse it robustly to handle fractions (1/2), commas (1,000), or error states.
  const getValidCurrencyAmount = (val: string): number => {
    if (isError(val)) return 0;
    
    // Remove commas if present (though usually handled by display formatting, safe to strip)
    const cleanVal = val.replace(/,/g, '');
    
    // Handle fractions like "1/2" which standard parseFloat parses as "1"
    if (cleanVal.includes('/')) {
        const [num, den] = cleanVal.split('/').map(Number);
        if (!isNaN(num) && !isNaN(den) && den !== 0) {
            return num / den;
        }
    }
    
    const parsed = parseFloat(cleanVal);
    return isNaN(parsed) ? 0 : parsed;
  };

  const currencyAmount = getValidCurrencyAmount(displayValue);
  const convertedCurrencyValue = convertCurrency(currencyAmount, currencyFrom, currencyTo, exchangeRates);
  const exchangeRate = getExchangeRate(currencyFrom, currencyTo, exchangeRates);

  // Unit conversion calculations
  const unitAmount = getValidCurrencyAmount(displayValue);
  const convertedUnitValue = convertUnit(unitAmount, unitFrom, unitTo, unitCategory);
  const unitConversionRate = getConversionRate(unitFrom, unitTo, unitCategory);

  const getModeLabel = () => {
    if (mode === 'currency' || mode === 'units') return 'Calculator'; // When in converter modes, button says "Calculator" to go back
    if (mode === 'simple') return 'Scientific';   // When in simple, button says "Scientific" to switch to it
    return 'Simple';                              // When in scientific, button says "Simple" to switch back
  };

  return (
    <>
      <div className="h-[100dvh] w-full max-w-md mx-auto bg-black flex flex-col p-3 overflow-hidden box-border">
        
        {/* Top Controls Row */}
        <div className="flex-none flex items-center justify-between mb-3 gap-2">
          
          <div className="flex flex-grow gap-2 min-w-0">
            {/* Mode Switcher */}
            <button 
              onClick={handleModeToggle}
              className="px-4 bg-gray-700 text-white font-semibold py-2 rounded-full hover:bg-gray-600 transition-colors flex-1 text-sm shadow-sm truncate"
            >
              {getModeLabel()}
            </button>
            
            {/* Currency Button */}
             <button 
                onClick={handleCurrencyToggle}
                className={`px-3 font-semibold py-2 rounded-full transition-colors text-xs shadow-sm truncate ${mode === 'currency' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
             >
                💱
             </button>
             
             {/* Units Button */}
             <button 
                onClick={handleUnitsToggle}
                className={`px-3 font-semibold py-2 rounded-full transition-colors text-xs shadow-sm truncate ${mode === 'units' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
             >
                📏
             </button>
          </div>
          
          {/* Action Group: Undo/Redo, AI, History */}
          <div className="flex items-center gap-1.5 shrink-0">
             
             {/* Undo */}
             <button 
                onClick={handleUndo} 
                disabled={undoStack.length === 0}
                className="p-2.5 bg-gray-700 text-white rounded-full hover:bg-gray-600 disabled:opacity-30 disabled:hover:bg-gray-700 transition-all shadow-sm"
                aria-label="Undo"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
             </button>

             {/* Redo */}
             <button 
                onClick={handleRedo} 
                disabled={redoStack.length === 0}
                className="p-2.5 bg-gray-700 text-white rounded-full hover:bg-gray-600 disabled:opacity-30 disabled:hover:bg-gray-700 transition-all shadow-sm"
                aria-label="Redo"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
             </button>

             {/* AI Check */}
             <button
              onClick={handleAICheck}
              disabled={isThinking}
              className={`p-2.5 rounded-full text-white transition-all shadow-lg flex items-center justify-center ${
                isThinking 
                  ? 'bg-gradient-to-br from-indigo-400 to-purple-400 animate-pulse ring-2 ring-purple-300 ring-opacity-50 cursor-wait' 
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 cursor-pointer'
              }`}
              aria-label="AI Check"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
            </button>

            {/* History */}
            <button
              onClick={() => setShowHistory(true)}
              className="p-2.5 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors shadow-sm"
              aria-label="History"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Screen / Display */}
        <div className="flex-none mb-3">
            <Display 
              expression={
                mode === 'currency' 
                  ? `${CURRENCY_FLAGS[currencyFrom]} ${currencyFrom} to ${CURRENCY_FLAGS[currencyTo]} ${currencyTo}` 
                  : mode === 'units'
                  ? `${UNITS[unitCategory][unitFrom]?.name || unitFrom} to ${UNITS[unitCategory][unitTo]?.name || unitTo}`
                  : expression
              } 
              displayValue={displayValue} 
              angleMode={angleMode} 
              onPaste={handlePaste}
            />
        </div>

        {/* Keypad Area */}
        <div className="flex-grow min-h-0 grid grid-cols-4 gap-2">
            
            {/* Currency Converter Panel - Appears instead of Scientific Buttons */}
            {mode === 'currency' && (
              <div className="col-span-4 bg-gray-800/80 rounded-2xl p-4 flex flex-col justify-center gap-4 mb-2 border border-gray-700 relative overflow-hidden">
                 {/* Background subtle gradient for active mode feel */}
                 <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none"></div>

                 {/* API Status Indicator */}
                 <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${ratesLoaded ? 'bg-green-500' : 'bg-red-500 animate-pulse'} shadow-sm`} title={ratesLoaded ? "Live Rates Active" : "Using Default Rates"}></div>

                 {/* Currency Controls */}
                 <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
                    <div className="flex-1 min-w-0">
                      <select 
                        value={currencyFrom} 
                        onChange={e => setCurrencyFrom(e.target.value)}
                        className="w-full bg-gray-900 text-white text-sm font-semibold py-3 px-3 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none shadow-sm transition-shadow"
                      >
                        {Object.keys(exchangeRates).map(curr => (
                          <option key={curr} value={curr}>{CURRENCY_FLAGS[curr]} {curr} - {CURRENCY_SYMBOLS[curr]}</option>
                        ))}
                      </select>
                    </div>
                    
                    <button 
                      onClick={handleSwapCurrency}
                      className="p-2.5 bg-gray-700 hover:bg-gray-600 rounded-full text-orange-500 transition-all hover:rotate-180 duration-300 shadow-md"
                      title="Swap Currencies"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </button>

                    <div className="flex-1 min-w-0">
                      <select 
                        value={currencyTo} 
                        onChange={e => setCurrencyTo(e.target.value)}
                        className="w-full bg-gray-900 text-white text-sm font-semibold py-3 px-3 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none shadow-sm transition-shadow"
                      >
                        {Object.keys(exchangeRates).map(curr => (
                          <option key={curr} value={curr}>{CURRENCY_FLAGS[curr]} {curr} - {CURRENCY_SYMBOLS[curr]}</option>
                        ))}
                      </select>
                    </div>
                 </div>

                 {/* Conversion Result Display */}
                 <div className="flex flex-col items-end relative z-10">
                    <div className="text-gray-400 text-xs mb-1 font-medium tracking-wide">
                      {CURRENCY_FLAGS[currencyFrom]} {displayValue} {currencyFrom} =
                    </div>
                    <div className="text-4xl font-bold text-white break-all text-right leading-none tracking-tight">
                      {isError(displayValue) ? '---' : formattedCurrency(convertedCurrencyValue)} <span className="text-xl text-orange-500 font-semibold">{CURRENCY_FLAGS[currencyTo]} {currencyTo}</span>
                    </div>
                 </div>

                 {/* Rate Info */}
                 <div className="text-[10px] text-gray-500 text-center font-mono mt-4 pt-3 border-t border-gray-700/50">
                   1 {currencyFrom} ({CURRENCY_SYMBOLS[currencyFrom]}) ≈ {exchangeRate.toFixed(4)} {currencyTo} ({CURRENCY_SYMBOLS[currencyTo]})
                 </div>
              </div>
            )}

            {/* Unit Converter Panel */}
            {mode === 'units' && (
              <div className="col-span-4 bg-gray-800/80 rounded-2xl p-4 flex flex-col justify-center gap-3 mb-2 border border-gray-700 relative overflow-hidden">
                 {/* Background subtle gradient for active mode feel */}
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none"></div>

                 {/* Category Selector */}
                 <div className="flex flex-wrap gap-1.5 justify-center relative z-10 mb-2">
                    {(Object.keys(UNIT_CATEGORIES) as UnitCategory[]).map(cat => (
                      <button 
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                          unitCategory === cat 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {UNIT_CATEGORIES[cat].icon} {UNIT_CATEGORIES[cat].name}
                      </button>
                    ))}
                 </div>

                 {/* Unit Controls */}
                 <div className="flex items-center justify-between gap-3 relative z-10">
                    <div className="flex-1 min-w-0">
                      <select 
                        value={unitFrom} 
                        onChange={e => setUnitFrom(e.target.value)}
                        className="w-full bg-gray-900 text-white text-xs font-semibold py-2.5 px-2 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm transition-shadow"
                      >
                        {Object.keys(UNITS[unitCategory]).map(key => (
                          <option key={key} value={key}>{UNITS[unitCategory][key].name} ({UNITS[unitCategory][key].symbol})</option>
                        ))}
                      </select>
                    </div>
                    
                    <button 
                      onClick={handleSwapUnits}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full text-blue-400 transition-all hover:rotate-180 duration-300 shadow-md"
                      title="Swap Units"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </button>

                    <div className="flex-1 min-w-0">
                      <select 
                        value={unitTo} 
                        onChange={e => setUnitTo(e.target.value)}
                        className="w-full bg-gray-900 text-white text-xs font-semibold py-2.5 px-2 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm transition-shadow"
                      >
                        {Object.keys(UNITS[unitCategory]).map(key => (
                          <option key={key} value={key}>{UNITS[unitCategory][key].name} ({UNITS[unitCategory][key].symbol})</option>
                        ))}
                      </select>
                    </div>
                 </div>

                 {/* Conversion Result Display */}
                 <div className="flex flex-col items-end relative z-10">
                    <div className="text-gray-400 text-xs mb-1 font-medium tracking-wide">
                      {displayValue} {UNITS[unitCategory][unitFrom]?.symbol} =
                    </div>
                    <div className="text-3xl font-bold text-white break-all text-right leading-none tracking-tight">
                      {isError(displayValue) ? '---' : formatUnitValue(convertedUnitValue)} <span className="text-lg text-blue-400 font-semibold">{UNITS[unitCategory][unitTo]?.symbol}</span>
                    </div>
                 </div>

                 {/* Rate Info */}
                 <div className="text-[10px] text-gray-500 text-center font-mono pt-2 border-t border-gray-700/50">
                   1 {UNITS[unitCategory][unitFrom]?.symbol} ≈ {formatUnitValue(unitConversionRate)} {UNITS[unitCategory][unitTo]?.symbol}
                 </div>
              </div>
            )}

            {/* Scientific Buttons (Conditional) */}
            {mode === 'scientific' && scientificButtons.map(({label, className}) => (
                <CalculatorButton key={label} label={label} onClick={handleButtonClick} className={className} />
            ))}

            {/* Standard Keypad */}
            <CalculatorButton label="AC" onClick={handleButtonClick} className={specialButtonClass} />
            <CalculatorButton label="+/-" onClick={handleButtonClick} className={specialButtonClass} />
            <CalculatorButton label="%" onClick={handleButtonClick} className={specialButtonClass} />
            <CalculatorButton label="÷" onClick={handleButtonClick} className={operatorButtonClass} />

            <CalculatorButton label="7" onClick={handleButtonClick} className={numberButtonClass} />
            <CalculatorButton label="8" onClick={handleButtonClick} className={numberButtonClass} />
            <CalculatorButton label="9" onClick={handleButtonClick} className={numberButtonClass} />
            <CalculatorButton label="×" onClick={handleButtonClick} className={operatorButtonClass} />

            <CalculatorButton label="4" onClick={handleButtonClick} className={numberButtonClass} />
            <CalculatorButton label="5" onClick={handleButtonClick} className={numberButtonClass} />
            <CalculatorButton label="6" onClick={handleButtonClick} className={numberButtonClass} />
            <CalculatorButton label="-" onClick={handleButtonClick} className={operatorButtonClass} />
            
            <CalculatorButton label="1" onClick={handleButtonClick} className={numberButtonClass} />
            <CalculatorButton label="2" onClick={handleButtonClick} className={numberButtonClass} />
            <CalculatorButton label="3" onClick={handleButtonClick} className={numberButtonClass} />
            <CalculatorButton label="+" onClick={handleButtonClick} className={operatorButtonClass} />
            
            <CalculatorButton label="0" onClick={handleButtonClick} className={numberButtonClass} />
            <CalculatorButton label="." onClick={handleButtonClick} className={numberButtonClass} />
            <CalculatorButton label="DEL" onClick={handleButtonClick} className={specialButtonClass} />
            <CalculatorButton label="=" onClick={handleButtonClick} className={operatorButtonClass} />
        </div>
      </div>
      
      {/* Fragments */}
      {showHistory && (
        <HistoryPanel
            history={history}
            onClose={() => setShowHistory(false)}
            onClear={handleClearHistory}
            onItemClick={handleHistoryItemClick}
        />
      )}
      
      <AIResponsePanel 
        isOpen={aiPanelOpen}
        isLoading={isThinking}
        response={aiResponse}
        onClose={() => setAiPanelOpen(false)}
      />
    </>
  );
};

// Helper for formatting currency output
const formattedCurrency = (val: number) => {
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
};

// Helper for formatting unit output
const formatUnitValue = (val: number) => {
  if (!isFinite(val) || isNaN(val)) return '---';
  if (Math.abs(val) < 0.0001 || Math.abs(val) >= 1000000) {
    return val.toExponential(4);
  }
  return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 });
};

export default App;
