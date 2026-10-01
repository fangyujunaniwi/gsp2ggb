/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.PointOnObject;
import com.keypress.Gobjects.PolygonalPoint;
import com.keypress.Gobjects.gPolygon;

public class PointOnPolygon
extends PointOnObject {
    private double offset;

    public PointOnPolygon(GObject circle, double offset) {
        super(circle);
        this.offset = offset;
    }

    void mapPointToHost() {
        gPolygon host = (gPolygon)this.getParent(0);
        PolygonalPoint newLoc = host.mapPointToNearestEdge(this.x, this.y);
        this.x = newLoc.x;
        this.y = newLoc.y;
        this.offset = newLoc.offset;
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing) {
            gPolygon host = (gPolygon)this.getParent(0);
            PolygonalPoint newLoc = host.mapOffsetToPoint(this.offset);
            this.x = newLoc.x;
            this.y = newLoc.y;
        }
    }

    public final double getOffset() {
        return this.offset;
    }

    public final void setOffset(double iOffset) {
        this.offset = iOffset;
    }
}

