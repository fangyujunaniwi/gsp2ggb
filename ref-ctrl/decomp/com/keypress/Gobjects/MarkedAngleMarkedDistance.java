/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.SimpleMeasure;
import com.keypress.Gobjects.Translator;

public class MarkedAngleMarkedDistance
extends Translator {
    SimpleMeasure markedAngle;
    SimpleMeasure markedDistance;

    public MarkedAngleMarkedDistance(GObject markedAngle, GObject markedDistance) {
        this.markedDistance = (SimpleMeasure)markedDistance;
        this.markedAngle = (SimpleMeasure)markedAngle;
    }

    public final boolean prepareTransformer(GObject image) {
        if (this.markedAngle.isDefined() && this.markedDistance.isDefined()) {
            double a = this.markedAngle.value / this.markedAngle.conversionFactor;
            this.deltaX = this.markedDistance.value * Math.cos(a);
            this.deltaY = -this.markedDistance.value * Math.sin(a);
            return true;
        }
        return false;
    }
}

