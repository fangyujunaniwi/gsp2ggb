/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.SimpleMeasure;
import com.keypress.Gobjects.gCircle;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.gStraight;

public class CircleCenterAndRadius
extends gCircle {
    public CircleCenterAndRadius(GObject center, GObject radiusSegOrMeasure) {
        super(2);
        this.AssignParent(0, center);
        this.AssignParent(1, radiusSegOrMeasure);
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing) {
            gPoint centerPt = (gPoint)this.getParent(0);
            GObject radiusParent = this.getParent(1);
            this.centerX = centerPt.getX();
            this.centerY = centerPt.getY();
            if (radiusParent instanceof gStraight) {
                gStraight radiusSeg = (gStraight)radiusParent;
                this.radius = radiusSeg.getPixelLength();
            } else {
                SimpleMeasure radiusLen = (SimpleMeasure)radiusParent;
                if (!radiusLen.isDefined()) {
                    this.existing = false;
                    return;
                }
                this.radius = radiusLen.value;
            }
            this.updateSecondaryConstraints();
        }
    }
}

