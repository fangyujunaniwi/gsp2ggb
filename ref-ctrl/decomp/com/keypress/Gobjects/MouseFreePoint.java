/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.AffectedDescendents;
import com.keypress.Gobjects.Draggable;
import com.keypress.Gobjects.gPoint;

abstract class MouseFreePoint
extends gPoint
implements Draggable {
    AffectedDescendents affected = new AffectedDescendents();

    public MouseFreePoint(int numParents, double x, double y) {
        super(0);
        this.x = x;
        this.y = y;
        this.existing = true;
        this.setColor(gPoint._defaultFreePointColor);
    }

    public final AffectedDescendents getAffectedDescendents() {
        return this.affected;
    }

    public boolean isDraggable() {
        return true;
    }

    public void dragTo(double x, double y, boolean locusDriving) {
        this.x = x;
        this.y = y;
        this.affected.constrainDescendents(locusDriving);
    }
}

