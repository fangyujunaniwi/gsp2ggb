/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.equFormCompOp;
import com.keypress.Gobjects.exprToken;
import com.keypress.Gobjects.functionEvalRef;
import com.keypress.Gobjects.numericConstant;
import com.keypress.Gobjects.parseEvalFailure;
import com.keypress.Gobjects.predefFunc;
import com.keypress.Gobjects.variableRef;

public class parseList {
    static final int addition_Op = 1;
    static final int subtraction_Op = 2;
    static final int multiplication_Op = 3;
    static final int division_Op = 4;
    static final int exponentiation_Op = 5;
    static final int terminal_Op = 6;
    static final int openParen_Op = 7;
    static final int openPredefFunc_Op = 8;
    static final int negation_Op = 9;
    static final int closeParen_Op = 10;
    static final int numericConstant_Op = 11;
    static final int variableRef_Op = 12;
    static final int equFormComponent_Op = 13;
    static final int functionEvalRef_Op = 14;
    static final int independentVarRef_Op = 15;
    static final int Optimize_MaxTokens = 40;
    private exprToken[] tokens;
    private GObject owningGObj;

    private void buildTokenList(String theExpr) {
        int numTokens = 0;
        int pos = 0;
        while (pos < theExpr.length()) {
            char next = theExpr.charAt(pos);
            if (next == ' ') {
                ++pos;
                continue;
            }
            if (next == 'x') {
                this.tokens[numTokens++] = new exprToken(15);
                ++pos;
                continue;
            }
            if (next >= 'A' && next <= 'Z') {
                this.tokens[numTokens++] = new variableRef(next - 65);
                ++pos;
                continue;
            }
            if (next == '#') {
                this.tokens[numTokens++] = new equFormCompOp(theExpr.charAt(pos + 1) - 65, theExpr.charAt(pos + 2) - 48);
                pos += 3;
                continue;
            }
            if (next == '@' && "@f".regionMatches(0, theExpr, pos, 2)) {
                char parentFunctionRef = theExpr.charAt(pos + 2);
                this.tokens[numTokens++] = new functionEvalRef(parentFunctionRef - 65);
                pos += 3;
                continue;
            }
            if (next == '@') {
                int predef = 0;
                predef = "sin_".regionMatches(0, theExpr, ++pos, 4) ? 1 : ("cos_".regionMatches(0, theExpr, pos, 4) ? 2 : ("abs_".regionMatches(0, theExpr, pos, 4) ? 3 : ("sqrt".regionMatches(0, theExpr, pos, 4) ? 4 : ("ln__".regionMatches(0, theExpr, pos, 4) ? 5 : ("rond".regionMatches(0, theExpr, pos, 4) ? 6 : ("trnc".regionMatches(0, theExpr, pos, 4) ? 7 : ("acos".regionMatches(0, theExpr, pos, 4) ? 8 : ("asin".regionMatches(0, theExpr, pos, 4) ? 9 : ("atan".regionMatches(0, theExpr, pos, 4) ? 10 : ("log_".regionMatches(0, theExpr, pos, 4) ? 11 : ("sgn_".regionMatches(0, theExpr, pos, 4) ? 12 : ("tan_".regionMatches(0, theExpr, pos, 4) ? 13 : -1))))))))))));
                this.tokens[numTokens++] = new predefFunc(predef);
                pos += 4;
                continue;
            }
            if (next == '+') {
                this.tokens[numTokens++] = new exprToken(1);
                ++pos;
                continue;
            }
            if (next == '-') {
                this.tokens[numTokens++] = new exprToken(2);
                ++pos;
                continue;
            }
            if (next == '*') {
                this.tokens[numTokens++] = new exprToken(3);
                ++pos;
                continue;
            }
            if (next == '/') {
                this.tokens[numTokens++] = new exprToken(4);
                ++pos;
                continue;
            }
            if (next == '^') {
                this.tokens[numTokens++] = new exprToken(5);
                ++pos;
                continue;
            }
            if (next == '!') {
                this.tokens[numTokens++] = new exprToken(9);
                ++pos;
                continue;
            }
            int numDigits = 1;
            char aDigit = theExpr.charAt(pos + numDigits);
            while (aDigit >= '0' && aDigit <= '9' || aDigit == '.') {
                aDigit = theExpr.charAt(pos + ++numDigits);
            }
            String temp = theExpr.substring(pos, pos + numDigits);
            this.tokens[numTokens++] = new numericConstant(Double.valueOf(temp));
            pos += numDigits;
        }
    }

    private int countTokens(String theExpr) {
        int numTokens = 0;
        int pos = 0;
        boolean skipping = false;
        while (pos < theExpr.length()) {
            char next = theExpr.charAt(pos);
            if (next == ' ') {
                ++pos;
                skipping = false;
                continue;
            }
            if (next >= 'A' && next <= 'Z') {
                ++numTokens;
                ++pos;
                skipping = false;
                continue;
            }
            if (next == '@' && "@f".regionMatches(0, theExpr, pos, 2)) {
                ++numTokens;
                pos += 2;
                skipping = false;
                continue;
            }
            if (next == '@') {
                ++numTokens;
                pos += 5;
                skipping = false;
                continue;
            }
            if (next == '#') {
                pos += 3;
                ++numTokens;
                continue;
            }
            if (next == '+' || next == '-' || next == '/' || next == '*' || next == '^' || next == '!') {
                ++numTokens;
                ++pos;
                skipping = false;
                continue;
            }
            if (!skipping) {
                ++numTokens;
            }
            ++pos;
            skipping = true;
        }
        return numTokens;
    }

    public parseList(String theExpr, GObject owner) {
        this.owningGObj = owner;
        this.tokens = new exprToken[this.countTokens(theExpr)];
        this.buildTokenList(theExpr);
    }

    public boolean parentsWellDefined() {
        int stop = this.tokens.length;
        for (int start = 0; start < stop && this.tokens[start] != null; ++start) {
            if (this.tokens[start].tokenType() != 12) continue;
            double variableValue = 0.0;
            try {
                variableValue = ((variableRef)this.tokens[start]).getParentValue(this.owningGObj);
                continue;
            }
            catch (parseEvalFailure pef) {
                return false;
            }
        }
        return true;
    }

    public double evaluate(double independentVar) throws parseEvalFailure {
        double[] stack = new double[40];
        int stackTop = -1;
        int stop = this.tokens.length;
        try {
            block16: for (int start = 0; start < stop && this.tokens[start] != null; ++start) {
                switch (this.tokens[start].tokenType()) {
                    case 11: {
                        stack[++stackTop] = ((numericConstant)this.tokens[start]).numValue();
                        continue block16;
                    }
                    case 12: {
                        stack[++stackTop] = ((variableRef)this.tokens[start]).getParentValue(this.owningGObj);
                        continue block16;
                    }
                    case 13: {
                        stack[++stackTop] = ((equFormCompOp)this.tokens[start]).getEquFormComponent(this.owningGObj);
                        continue block16;
                    }
                    case 8: {
                        stack[stackTop] = ((predefFunc)this.tokens[start]).apply(stack[stackTop]);
                        continue block16;
                    }
                    case 14: {
                        stack[stackTop] = ((functionEvalRef)this.tokens[start]).getParentFunctionValue(this.owningGObj, stack[stackTop]);
                        continue block16;
                    }
                    case 15: {
                        stack[++stackTop] = independentVar;
                        continue block16;
                    }
                    case 1: {
                        stack[--stackTop] = stack[stackTop] + stack[1 + stackTop];
                        continue block16;
                    }
                    case 2: {
                        stack[--stackTop] = stack[stackTop] - stack[1 + stackTop];
                        continue block16;
                    }
                    case 3: {
                        stack[--stackTop] = stack[stackTop] * stack[1 + stackTop];
                        continue block16;
                    }
                    case 4: {
                        stack[--stackTop] = stack[stackTop] / stack[1 + stackTop];
                        continue block16;
                    }
                    case 5: {
                        stack[--stackTop] = Math.pow(stack[stackTop], stack[1 + stackTop]);
                        continue block16;
                    }
                    case 9: {
                        stack[stackTop] = -stack[stackTop];
                    }
                }
            }
        }
        catch (Exception e) {
            throw new parseEvalFailure();
        }
        if (Double.isNaN(stack[stackTop])) {
            throw new parseEvalFailure();
        }
        return stack[stackTop];
    }
}

