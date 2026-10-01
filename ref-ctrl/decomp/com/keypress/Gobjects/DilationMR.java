/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Dilater;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.SimpleMeasure;
import com.keypress.Gobjects.gPoint;

public class DilationMR
extends Dilater {
    gPoint center;
    SimpleMeasure ratioMeasure;
    boolean preImageIsPoint;

    public DilationMR(GObject theCenter, GObject ratioMeasure, boolean isPointPreimage) {
        this.center = (gPoint)theCenter;
        this.ratioMeasure = (SimpleMeasure)ratioMeasure;
        this.preImageIsPoint = isPointPreimage;
    }

    public final boolean prepareTransformer(GObject image) {
        if (this.ratioMeasure.isDefined()) {
            this.centerX = this.center.getX();
            this.centerY = this.center.getY();
            this.scaleFactor = this.ratioMeasure.value;
            return this.scaleFactor != 0.0 || this.preImageIsPoint;
        }
        return false;
    }
}

