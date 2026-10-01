/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.MultiMeasure;
import com.keypress.Gobjects.exprToken;
import com.keypress.Gobjects.parseEvalFailure;

class equFormCompOp
extends exprToken {
    int theParent;
    int theEquFormComponent;

    public equFormCompOp(int parent, int equFormComp) {
        super(13);
        this.theParent = parent;
        this.theEquFormComponent = equFormComp;
    }

    public final double getEquFormComponent(GObject child) throws parseEvalFailure {
        MultiMeasure aParent = (MultiMeasure)child.getParent(this.theParent);
        if (aParent.isDefined && aParent.isEquFormComponentDefined(this.theEquFormComponent)) {
            return aParent.getDefinedEquFormComponent(this.theEquFormComponent);
        }
        throw new parseEvalFailure();
    }
}

