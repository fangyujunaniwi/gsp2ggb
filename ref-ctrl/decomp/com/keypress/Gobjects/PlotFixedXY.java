/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gCoordSys;
import com.keypress.Gobjects.gPoint;

public class PlotFixedXY
extends gPoint {
    double xCoord;
    double yCoord;

    public PlotFixedXY(GObject[] parents, double x, double y) {
        super(1);
        this.AssignParents(parents);
        this.xCoord = x;
        this.yCoord = y;
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing) {
            gCoordSys coord = (gCoordSys)this.getParent(0);
            this.x = coord.getOriginX() + this.xCoord * coord.getUnitLengthX();
            this.y = coord.getOriginY() - this.yCoord * coord.getUnitLengthY();
        }
    }
}

