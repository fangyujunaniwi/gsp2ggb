/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.SimpleMeasure;
import com.keypress.Gobjects.gCoordSys;
import com.keypress.Gobjects.gPoint;

public class PlotXY
extends gPoint {
    public PlotXY(GObject[] parents) {
        super(3);
        this.AssignParents(parents);
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing) {
            SimpleMeasure measureY = (SimpleMeasure)this.getParent(0);
            SimpleMeasure measureX = (SimpleMeasure)this.getParent(2);
            gCoordSys coord = (gCoordSys)this.getParent(1);
            if (measureX.isDefined() && measureY.isDefined()) {
                this.x = measureX.value * coord.getUnitLengthX() + coord.getOriginX();
                this.y = coord.getOriginY() - measureY.value * coord.getUnitLengthY();
            } else {
                this.existing = false;
            }
        }
    }
}

