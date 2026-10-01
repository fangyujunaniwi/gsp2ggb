/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Sketch;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.gStraight;

abstract class gStraightThrough2Points
extends gStraight {
    public gStraightThrough2Points(Sketch mySketch, GObject parent1, GObject parent2, int StraightType) {
        super(mySketch, 2, StraightType);
        this.AssignParent(0, parent1);
        this.AssignParent(1, parent2);
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing) {
            gPoint p1 = (gPoint)this.getParent(0);
            gPoint p2 = (gPoint)this.getParent(1);
            this.x1 = p1.getX();
            this.y1 = p1.getY();
            this.x2 = p2.getX();
            this.y2 = p2.getY();
            this.updateSecondaryConstraints();
        }
    }
}

