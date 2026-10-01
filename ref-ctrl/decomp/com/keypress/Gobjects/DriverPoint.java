/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Draggable;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.MouseFreePoint;
import com.keypress.Gobjects.SimpleMeasure;
import com.keypress.Gobjects.gCoordSys;

public class DriverPoint
extends MouseFreePoint
implements Draggable {
    public DriverPoint(GObject[] parents) {
        super(3, 0.0, 0.0);
        this.AssignParents(parents);
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing) {
            SimpleMeasure measureY = (SimpleMeasure)this.getParent(0);
            SimpleMeasure measureX = (SimpleMeasure)this.getParent(1);
            gCoordSys coord = (gCoordSys)this.getParent(2);
            if (measureX.isDefined() && measureY.isDefined()) {
                this.x = measureX.value * coord.getUnitLengthX() + coord.getOriginX();
                this.y = coord.getOriginY() - measureY.value * coord.getUnitLengthY();
            } else {
                this.existing = false;
            }
        }
    }
}

