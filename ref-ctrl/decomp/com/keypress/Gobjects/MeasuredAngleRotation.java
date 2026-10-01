/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Rotater;
import com.keypress.Gobjects.SimpleMeasure;
import com.keypress.Gobjects.gPoint;

public class MeasuredAngleRotation
extends Rotater {
    gPoint center;
    SimpleMeasure measure;

    public MeasuredAngleRotation(GObject theCenter, GObject mAngle) {
        this.center = (gPoint)theCenter;
        this.measure = (SimpleMeasure)mAngle;
    }

    public final boolean prepareTransformer(GObject image) {
        if (this.measure.isDefined()) {
            this.PrepareRotation(this.center, this.measure.value);
            return true;
        }
        return false;
    }
}

