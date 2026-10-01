/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Sketch;
import com.keypress.Gobjects.gCircle;
import com.keypress.Gobjects.gCoordSys;

public class UnitCircleCoords
extends gCoordSys {
    public UnitCircleCoords(GObject circle, Sketch theSketch) {
        super(1, theSketch);
        this.AssignParent(0, circle);
    }

    public void Constrain(boolean locusDriving) {
        gCircle A = (gCircle)this.getParent(0);
        if (A.isExisting()) {
            this.existing = true;
            this.originX = A.getCenterX();
            this.originY = A.getCenterY();
            this.unitLengthX = this.unitLengthY = A.getPixelRadius();
        } else {
            this.existing = false;
        }
    }
}

