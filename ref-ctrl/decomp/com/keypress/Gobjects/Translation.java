/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Translator;

public class Translation
extends Translator {
    public Translation(double dX, double dY) {
        this.deltaX = dX;
        this.deltaY = -dY;
    }

    public final boolean prepareTransformer(GObject image) {
        return true;
    }
}

