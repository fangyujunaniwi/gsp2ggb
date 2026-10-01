/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.SimpleMeasure;
import com.keypress.Gobjects.exprToken;
import com.keypress.Gobjects.parseEvalFailure;

class variableRef
extends exprToken {
    int theParent;

    public variableRef(int aParent) {
        super(12);
        this.theParent = aParent;
    }

    public final double getParentValue(GObject child) throws parseEvalFailure {
        SimpleMeasure aParent = (SimpleMeasure)child.getParent(this.theParent);
        if (aParent.isDefined) {
            return aParent.value;
        }
        throw new parseEvalFailure();
    }
}

