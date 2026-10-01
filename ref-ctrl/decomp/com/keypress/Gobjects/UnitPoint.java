/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gPoint;

public abstract class UnitPoint
extends gPoint {
    private double pixelsFromOrigin;
    private boolean isHorizontal;

    public UnitPoint(GObject origin, int numParents, double pixelDistFromOrigin, boolean isHorizontal) {
        super(numParents);
        this.AssignParent(0, origin);
        this.pixelsFromOrigin = pixelDistFromOrigin;
        this.isHorizontal = isHorizontal;
    }

    public final double getUnitScale() {
        return this.pixelsFromOrigin;
    }

    public final boolean isHorizontal() {
        return this.isHorizontal;
    }

    protected void setUnitScale(double newPixelsFromOrigin) {
        this.pixelsFromOrigin = newPixelsFromOrigin;
    }

    protected final GObject getOriginGObj() {
        return this.getParent(0);
    }

    protected double getOriginX() {
        gPoint p = (gPoint)this.getParent(0);
        return p.getX();
    }

    protected double getOriginY() {
        gPoint p = (gPoint)this.getParent(0);
        return p.getY();
    }
}

