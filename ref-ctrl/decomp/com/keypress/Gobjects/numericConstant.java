/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.exprToken;

class numericConstant
extends exprToken {
    double Value;

    public numericConstant(double theVal) {
        super(11);
        this.Value = theVal;
    }

    public final double numValue() {
        return this.Value;
    }
}

