/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.UnitPoint;
import com.keypress.Gobjects.gPoint;

public class SquareUnitPoint
extends UnitPoint {
    public SquareUnitPoint(GObject unitPointToWhichWereSquare) {
        super(((UnitPoint)unitPointToWhichWereSquare).getOriginGObj(), 2, 0.0, !((UnitPoint)unitPointToWhichWereSquare).isHorizontal());
        this.AssignParent(1, unitPointToWhichWereSquare);
    }

    public void Constrain(boolean locusDriving) {
        gPoint p = (gPoint)this.getParent(0);
        UnitPoint u = (UnitPoint)this.getParent(1);
        boolean bl = this.existing = p.isExisting() && u.isExisting();
        if (this.existing) {
            this.setUnitScale(u.getUnitScale());
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

