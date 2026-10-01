/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.AffectedDescendents;
import com.keypress.Gobjects.Draggable;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.UnitPoint;
import com.keypress.Gobjects.gPoint;

public abstract class DraggableUnitPoint
extends UnitPoint
implements Draggable {
    AffectedDescendents affected = new AffectedDescendents();

    public DraggableUnitPoint(GObject origin, double pixelDistFromOrigin, boolean isHorizontal) {
        super(origin, 1, pixelDistFromOrigin, isHorizontal);
        this.setColor(gPoint._defaultFreePointColor);
    }

    public final AffectedDescendents getAffectedDescendents() {
        return this.affected;
    }

    public boolean isDraggable() {
        return true;
    }

    public void dragTo(double x, double y, boolean locusDriving) {
        if (this.parentsExisting()) {
            this.existing = true;
            if (this.isHorizontal()) {
                this.y = this.getOriginY();
                if (x < this.getOriginX() + 1.0) {
                    x = this.getOriginX() + 1.0;
                }
                this.x = x;
                this.setUnitScale(x - this.getOriginX());
            } else {
                this.x = this.getOriginX();
                if (y > this.getOriginY() + 1.0) {
                    y = this.getOriginY() + 1.0;
                }
                this.y = y;
                this.setUnitScale(this.getOriginY() - y);
            }
        } else {
            this.existing = false;
        }
        this.affected.constrainDescendents(locusDriving);
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing) {
            this.x = this.getOriginX();
            this.y = this.getOriginY();
            if (this.isHorizontal()) {
                this.x += this.getUnitScale();
            } else {
                this.y -= this.getUnitScale();
            }
        }
    }
}

