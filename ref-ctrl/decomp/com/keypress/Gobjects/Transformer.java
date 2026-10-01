/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.doublePoint;

public abstract class Transformer {
    doublePoint image = new doublePoint();

    public abstract boolean prepareTransformer(GObject var1);

    public abstract doublePoint imageXY(double var1, double var3);

    public double imageScalar(double scalar) {
        return scalar;
    }

    public boolean imageIsColorized() {
        return false;
    }
}

