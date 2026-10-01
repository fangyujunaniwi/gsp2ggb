/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.exprToken;
import com.keypress.Gobjects.parseEvalFailure;

class predefFunc
extends exprToken {
    private int theOp;
    public static final int sin_Func = 1;
    public static final int cos_Func = 2;
    public static final int abs_Func = 3;
    public static final int sqrt_Func = 4;
    public static final int ln_Func = 5;
    public static final int round_Func = 6;
    public static final int trunc_Func = 7;
    public static final int acos_Func = 8;
    public static final int asin_Func = 9;
    public static final int atan_Func = 10;
    public static final int log_Func = 11;
    public static final int sgn_Func = 12;
    public static final int tan_Func = 13;

    public predefFunc(int predefFuncType) {
        super(8);
        this.theOp = predefFuncType;
    }

    public double apply(double arg) throws parseEvalFailure {
        try {
            switch (this.theOp) {
                case 13: {
                    return Math.tan(arg);
                }
                case 1: {
                    return Math.sin(arg);
                }
                case 2: {
                    return Math.cos(arg);
                }
                case 3: {
                    return Math.abs(arg);
                }
                case 4: {
                    return Math.sqrt(arg);
                }
                case 5: {
                    return Math.log(arg);
                }
                case 6: {
                    return Math.round(arg);
                }
                case 7: {
                    return Math.floor(arg);
                }
                case 8: {
                    return Math.acos(arg);
                }
                case 9: {
                    return Math.asin(arg);
                }
                case 10: {
                    return Math.atan(arg);
                }
                case 11: {
                    return Math.log(arg) / Math.log(10.0);
                }
                case 12: {
                    if (arg < 0.0) {
                        return -1.0;
                    }
                    if (arg > 0.0) {
                        return 1.0;
                    }
                    return 0.0;
                }
            }
        }
        catch (Exception e) {
            throw new parseEvalFailure();
        }
        return 0.0;
    }
}

