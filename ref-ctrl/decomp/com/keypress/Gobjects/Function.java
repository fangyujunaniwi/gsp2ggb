/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gText;
import com.keypress.Gobjects.parseList;
import java.awt.Font;

public class Function
extends gText {
    parseList theFunction;
    boolean initialized = false;

    public Function(String expr, String prefix, Font myFont, int numParents, GObject[] parents, int baseX, int baseY) {
        super(myFont, numParents, parents, baseX, baseY, prefix);
        this.theFunction = new parseList(expr, this);
        this.initialized = true;
    }

    public parseList getFunction() {
        return this.theFunction;
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
    }
}

