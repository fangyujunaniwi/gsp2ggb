/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Sketch;
import com.keypress.Gobjects.gStraight;

public abstract class Axis
extends gStraight {
    protected boolean isHorizontal;
    double unitScale;
    static final int FixedAxisLineLength = 400;
    static final int HalfFixedAxisLineLength = 200;

    public Axis(Sketch mySketch, int numParents, boolean isHorizontal) {
        super(mySketch, numParents, 2);
        this.isHorizontal = isHorizontal;
    }

    public abstract double getOrigin();

    public abstract double getUnitScale();
}

