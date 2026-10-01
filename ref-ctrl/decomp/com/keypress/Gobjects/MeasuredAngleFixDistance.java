/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.SimpleMeasure;
import com.keypress.Gobjects.Translator;

public class MeasuredAngleFixDistance
extends Translator {
    double fixedDistance;
    SimpleMeasure markedAngle;

    public MeasuredAngleFixDistance(GObject markedAngle, double fixedDistance) {
        this.markedAngle = (SimpleMeasure)markedAngle;
        this.fixedDistance = fixedDistance;
    }

    public final boolean prepareTransformer(GObject image) {
        if (this.markedAngle.isDefined()) {
            double v = this.markedAngle.value / this.markedAngle.conversionFactor;
            this.deltaX = this.fixedDistance * Math.cos(v);
            this.deltaY = -this.fixedDistance * Math.sin(v);
            return true;
        }
        return false;
    }
}

