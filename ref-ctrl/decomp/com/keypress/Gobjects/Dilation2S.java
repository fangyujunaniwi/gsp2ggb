/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Dilater;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.gStraight;

public class Dilation2S
extends Dilater {
    gPoint center;
    gStraight num;
    gStraight denom;
    boolean preImageIsPoint;

    public Dilation2S(GObject theCenter, GObject numSeg, GObject denomSeg, boolean isPointPreimage) {
        this.center = (gPoint)theCenter;
        this.num = (gStraight)numSeg;
        this.denom = (gStraight)denomSeg;
        this.preImageIsPoint = isPointPreimage;
    }

    public final boolean prepareTransformer(GObject image) {
        this.centerX = this.center.getX();
        this.centerY = this.center.getY();
        double numLength = this.num.getPixelLength();
        double denomLength = this.denom.getPixelLength();
        if (denomLength == 0.0) {
            return false;
        }
        this.scaleFactor = numLength / denomLength;
        return this.scaleFactor != 0.0 || this.preImageIsPoint;
    }
}

