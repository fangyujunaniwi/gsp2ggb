/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Transformer;
import com.keypress.Gobjects.doublePoint;

public abstract class Translator
extends Transformer {
    double deltaX;
    double deltaY;

    public final doublePoint imageXY(double preImageX, double preImageY) {
        this.image.x = preImageX + this.deltaX;
        this.image.y = preImageY + this.deltaY;
        return this.image;
    }
}

