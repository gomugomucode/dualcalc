
import { AngleMode } from '../types';

// ============================================================================
// Math Utilities / Helper Class
// This file encapsulates all pure mathematical logic, separating it from UI code.
// ============================================================================

/**
 * Calculates the factorial of a non-negative integer.
 * Returns NaN for negative numbers as factorial is undefined for them in this context.
 * 
 * @param n - The number to calculate the factorial of.
 * @returns The factorial of n (n!).
 */
export const factorial = (n: number): number => {
  if (n < 0) return NaN; 
  if (n === 0 || n === 1) return 1;
  
  let result = 1;
  // Iterative approach is safer for stack depth than recursion
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
};

/**
 * Attempts to convert a decimal number to a simplified fraction string.
 * Uses the continued fraction method for high precision approximation.
 * 
 * @param value - The decimal number to convert.
 * @param tolerance - The acceptable error margin (default 1e-9 for high precision).
 * @param maxDenominator - The largest denominator allowed (default 1,000,000).
 * @returns A string "numerator/denominator" or the original number if no good fraction is found.
 */
export const decimalToFraction = (value: number, tolerance = 1.0E-9, maxDenominator = 1000000): string | number => {
    if (!isFinite(value)) return value;
    if (Number.isInteger(value)) return value;

    const sign = value < 0 ? -1 : 1;
    const absValue = Math.abs(value);
    
    let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
    let b = absValue;
    
    do {
        const a = Math.floor(b);
        let aux = h1;
        h1 = a * h1 + h2;
        h2 = aux;
        aux = k1;
        k1 = a * k1 + k2;
        k2 = aux;
        b = 1 / (b - a);
    } while (Math.abs(value - sign * h1 / k1) > value * tolerance && k1 <= maxDenominator);

    // If we exceeded the max denominator, or the approximation isn't close enough, return decimal
    if (k1 > maxDenominator || Math.abs(value - sign * h1 / k1) > tolerance) {
        return value;
    }

    return `${sign * h1}/${k1}`;
};

/**
 * Helper to format the result of an evaluation.
 * Checks for errors, handles precision, and attempts fraction conversion.
 */
export const formatResult = (result: number | string): string => {
    if (typeof result === 'string') return result; // Return error strings as is
    if (!isFinite(result)) return "Can't divide by 0";
    if (isNaN(result)) return "Invalid Input";

    // 1. Check for floating point integers (e.g. 3.9999999999999999 -> 4)
    // If it is extremely close to an integer, snap to it to avoid display artifacts.
    if (Math.abs(result - Math.round(result)) < Number.EPSILON * 1000) {
        return String(Math.round(result));
    }

    // 2. Clean up standard floating point precision issues (e.g. 0.30000000000000004 -> 0.3)
    // We use 15 digits of precision, which is the safe limit for standard 64-bit floats.
    const preciseResult = parseFloat(result.toPrecision(15));
    
    // 3. Attempt fraction conversion with high precision requirements
    const fraction = decimalToFraction(preciseResult);
    
    return String(fraction);
};

/**
 * Evaluates a mathematical expression string.
 * 
 * Safety Note: This function uses `new Function()` which acts like eval().
 * While powerful, we must strictly sanitize input to prevent arbitrary code execution.
 * 
 * @param expression - The raw expression string (e.g. "5 + sin(30)").
 * @param angleMode - 'deg' or 'rad'. Determines how trig functions are calculated.
 * @returns A number (result) or string (Error Message).
 */
export const evaluateExpression = (expression: string, angleMode: AngleMode): number | string => {
  try {
    if (!expression) return 0;

    // --- 1. Tokenization and Initial Cleanup ---
    let sanitizedExpr = expression.replace(/\s/g, '');

    // --- 2. Symbol Replacement ---
    // Convert calculator symbols to JavaScript-compatible identifiers *BEFORE* implicit multiplication checks.
    // This allows logic like "2π" -> "2PI" -> "2*PI" to work correctly.
    sanitizedExpr = sanitizedExpr
      .replace(/×/g, '*')          // Multiply
      .replace(/÷/g, '/')          // Divide
      .replace(/π/g, 'PI')         // Will map to Math.PI in scope
      .replace(/(?<![0-9.])e(?![0-9+-])/g, 'E')  // Only replace standalone 'e' constant, not in scientific notation like 1e5
      .replace(/φ/g, 'PHI')        // Will map to Golden Ratio in scope
      .replace(/\^/g, '**')        // Exponentiation
      .replace(/√/g, 'sqrt')       // Will map to Math.sqrt
      .replace(/abs\(/g, 'abs(')   // Will map to Math.abs
      .replace(/--/g, '+');        // Double negative correction

    // --- 3. Implicit Multiplication Handling ---
    // Solves "identifier starts immediately after numeric literal" errors.
    // e.g., "5sin(30)" -> "5*sin(30)", "(5)(5)" -> "(5)*(5)", "5!2" -> "5!*2", "2PI" -> "2*PI"
    sanitizedExpr = sanitizedExpr
      // Case 1: Number followed by a letter (function/constant) or open parenthesis
      .replace(/(\d)([a-zA-Z(])/g, '$1*$2')
      // Case 2: Closing parenthesis followed by Number, Letter, or Open Parenthesis
      .replace(/(\))([a-zA-Z0-9(])/g, '$1*$2')
      // Case 3: Factorial (!) followed by Number, Letter, or Open Parenthesis
      .replace(/!([a-zA-Z0-9(])/g, '!*$1');

    // --- 4. Pre-Calculation Processing (Factorials) ---
    // JS doesn't support '5!', so we calculate literal factorials via regex.
    sanitizedExpr = sanitizedExpr.replace(/(\d+(?:\.\d+)?)!/g, (_, num) => {
      return String(factorial(Number(num)));
    });

    // --- 5. Safe Evaluation with Custom Scope ---
    // We define a context where trig functions handle the AngleMode (deg/rad) automatically.
    
    const degToRad = Math.PI / 180;
    
    // We construct the function body string.
    // Note: 'log' is base-10 (calculator standard), 'ln' is natural log (base-e).
    const functionBody = `
      const PI = Math.PI;
      const E = Math.E;
      const PHI = (1 + Math.sqrt(5)) / 2;
      
      const sin = (x) => Math.sin(${angleMode === 'deg'} ? x * ${degToRad} : x);
      const cos = (x) => Math.cos(${angleMode === 'deg'} ? x * ${degToRad} : x);
      const tan = (x) => Math.tan(${angleMode === 'deg'} ? x * ${degToRad} : x);
      
      const csc = (x) => 1 / Math.sin(${angleMode === 'deg'} ? x * ${degToRad} : x);
      const sec = (x) => 1 / Math.cos(${angleMode === 'deg'} ? x * ${degToRad} : x);
      const cot = (x) => 1 / Math.tan(${angleMode === 'deg'} ? x * ${degToRad} : x);
      
      const log = Math.log10; // Standard calculator 'log' is base 10
      const ln = Math.log;    // Standard calculator 'ln' is base e
      const sqrt = Math.sqrt;
      const abs = Math.abs;

      return ${sanitizedExpr};
    `;

    const calculate = new Function(functionBody);
    const result = calculate();

    // --- 6. Result Validation ---
    if (!isFinite(result)) {
        return "Can't divide by 0";
    }

    if (typeof result !== 'number' || isNaN(result)) {
      return 'Invalid Input';
    }
    
    return result;

  } catch (error) {
    console.error('Calculation Error:', error);
    return 'Format Error';
  }
};
