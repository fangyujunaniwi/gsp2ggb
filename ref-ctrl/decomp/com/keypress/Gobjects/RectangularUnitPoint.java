/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.DraggableUnitPoint;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.UnitPoint;

public class RectangularUnitPoint
extends DraggableUnitPoint {
    public RectangularUnitPoint(GObject origin, double pixelDistFromOrigin) {
        super(origin, pixelDistFromOrigin, !((UnitPoint)origin).isHorizontal());
    }

    protected double getOriginX() {
        UnitPoint p = (UnitPoint)this.getParent(0);
        return p.getOriginX();
    }

    protected double getOriginY() {
        UnitPoint p = (UnitPoint)this.getParent(0);
        return p.getOriginY();
    }
}

