/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.gStraight;

public class Midpoint
extends gPoint {
    public Midpoint(GObject theSeg) {
        super(1);
        this.AssignParent(0, theSeg);
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing) {
            gStraight theSeg = (gStraight)this.getParent(0);
            this.x = (theSeg.x1 + theSeg.x2) / 2.0;
            this.y = (theSeg.y1 + theSeg.y2) / 2.0;
        }
    }
}

