/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;

public class AffectedDescendents {
    private GObject[] descendents;
    int numDescendents = 0;
    GObject ignoreLastDescendent = null;

    public void countDescendent(GObject aDescendent) {
        if (aDescendent != this.ignoreLastDescendent) {
            ++this.numDescendents;
            this.ignoreLastDescendent = aDescendent;
        }
    }

    public void allocateAffectedDescendents() {
        this.ignoreLastDescendent = null;
        if (this.numDescendents != 0) {
            this.descendents = new GObject[this.numDescendents];
            this.numDescendents = 0;
        }
    }

    public void addDescendent(GObject aDescendent) {
        if (aDescendent != this.ignoreLastDescendent) {
            this.descendents[this.numDescendents++] = aDescendent;
            this.ignoreLastDescendent = aDescendent;
        }
    }

    public void constrainDescendents(boolean locusDriving) {
        for (int i = 0; i < this.numDescendents; ++i) {
            this.descendents[i].Constrain(locusDriving);
        }
    }
}

