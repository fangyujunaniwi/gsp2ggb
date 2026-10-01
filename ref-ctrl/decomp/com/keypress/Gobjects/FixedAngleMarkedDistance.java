/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.SimpleMeasure;
import com.keypress.Gobjects.Translator;

public class FixedAngleMarkedDistance
extends Translator {
    double fixedAngle;
    SimpleMeasure markedDistance;

    public FixedAngleMarkedDistance(GObject markedDistance, double fixedAngle) {
        this.markedDistance = (SimpleMeasure)markedDistance;
        this.fixedAngle = fixedAngle;
    }

    public final boolean prepareTransformer(GObject image) {
        if (this.markedDistance.isDefined()) {
            this.deltaX = this.markedDistance.value * Math.cos(this.fixedAngle);
            this.deltaY = -this.markedDistance.value * Math.sin(this.fixedAngle);
            return true;
        }
        return false;
    }
}

