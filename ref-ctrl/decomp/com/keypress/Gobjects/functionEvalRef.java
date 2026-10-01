/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Function;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.exprToken;
import com.keypress.Gobjects.parseEvalFailure;

class functionEvalRef
extends exprToken {
    int theParent;

    public functionEvalRef(int aParent) {
        super(14);
        this.theParent = aParent;
    }

    public final double getParentFunctionValue(GObject child, double independentVar) throws parseEvalFailure {
        Function aParent = (Function)child.getParent(this.theParent);
        return aParent.getFunction().evaluate(independentVar);
    }
}

