/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.gStraight;

public class LinearIntersection
extends gPoint {
    public LinearIntersection(GObject straight1, GObject straight2) {
        super(2);
        this.AssignParent(0, straight1);
        this.AssignParent(1, straight2);
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing) {
            gStraight p1 = (gStraight)this.getParent(0);
            gStraight p2 = (gStraight)this.getParent(1);
            if (p1.getdX() == 0.0) {
                if (p2.getdX() == 0.0) {
                    this.existing = false;
                } else {
                    this.x = p1.x1;
                    this.y = p2.slope * this.x + p2.yintercept;
                }
            } else if (p2.getdX() == 0.0) {
                this.x = p2.x1;
                this.y = p1.slope * this.x + p1.yintercept;
            } else if (p1.slope == p2.slope) {
                this.existing = false;
            } else {
                this.x = (p2.yintercept - p1.yintercept) / (p1.slope - p2.slope);
                this.y = Math.abs(p1.slope) < Math.abs(p2.slope) ? p1.slope * this.x + p1.yintercept : p2.slope * this.x + p2.yintercept;
            }
            if (this.existing) {
                this.existing = p1.includesPoint(this.x, this.y);
            }
            if (this.existing) {
                this.existing = p2.includesPoint(this.x, this.y);
            }
        }
    }
}

