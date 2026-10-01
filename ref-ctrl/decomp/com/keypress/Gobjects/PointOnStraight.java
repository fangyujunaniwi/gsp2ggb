/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.PointOnObject;
import com.keypress.Gobjects.gStraight;

public class PointOnStraight
extends PointOnObject {
    private double relativeLocation;

    public PointOnStraight(GObject straight, double relativeLocation) {
        super(straight);
        this.relativeLocation = relativeLocation;
    }

    void mapPointToHost() {
        gStraight straight = (gStraight)this.getParent(0);
        if (straight.getdX() == 0.0) {
            this.x = straight.x1;
        } else {
            double slope2 = straight.slope * straight.slope;
            double slope3 = slope2 + 1.0;
            double oldX = this.x;
            this.x = (slope2 * straight.x1 - straight.slope * straight.y1) / slope3 + (straight.slope * this.y + this.x) / slope3;
            this.y = (straight.y1 - straight.slope * straight.x1) / slope3 + (slope2 * this.y + straight.slope * oldX) / slope3;
        }
        if (straight.myStraightType == 0 || straight.myStraightType == 1) {
            if (straight.x1 < straight.x2 && straight.x1 > this.x || straight.x1 > straight.x2 && straight.x1 < this.x || straight.y1 < straight.y2 && straight.y1 > this.y || straight.y1 > straight.y2 && straight.y1 < this.y) {
                this.x = straight.x1;
                this.y = straight.y1;
            } else if (straight.myStraightType == 0 && (straight.x2 < straight.x1 && straight.x2 > this.x || straight.x2 > straight.x1 && straight.x2 < this.x || straight.y2 < straight.y1 && straight.y2 > this.y || straight.y2 > straight.y1 && straight.y2 < this.y)) {
                this.x = straight.x2;
                this.y = straight.y2;
            }
        }
        this.relativeLocation = Math.abs(straight.getdX()) > Math.abs(straight.getdY()) ? (this.x - straight.x1) / straight.getdX() : (this.y - straight.y1) / straight.getdY();
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing) {
            gStraight host = (gStraight)this.getParent(0);
            this.x = host.x1 + host.getdX() * this.relativeLocation;
            this.y = host.y1 + host.getdY() * this.relativeLocation;
        }
    }
}

