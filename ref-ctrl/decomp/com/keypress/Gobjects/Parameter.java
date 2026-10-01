/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.AffectedDescendents;
import com.keypress.Gobjects.Draggable;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.SimpleMeasure;
import java.awt.Font;

public class Parameter
extends SimpleMeasure
implements Draggable {
    AffectedDescendents affected = new AffectedDescendents();

    public Parameter(String prefix, Font myFont, double defaultValue, int baseX, int baseY, int digitsOfPrecision) {
        super(prefix, myFont, new GObject[0], baseX, baseY, 10, 1.0, digitsOfPrecision);
        this.value = defaultValue;
    }

    protected void updateValue(boolean updateStringRep) {
        this.existing = true;
        this.isDefined = true;
        if (updateStringRep) {
            this.convertValueToString();
        }
    }

    public boolean acceptsUserChanges() {
        return true;
    }

    public String externIOItemName(int requestedItemList) {
        return requestedItemList == 2 || requestedItemList == 3 ? this.prefix : null;
    }

    public void dragTo(double x, double y, boolean locusDriving) {
        this.value = x;
        this.Constrain(locusDriving);
        this.affected.constrainDescendents(locusDriving);
    }

    public void dragToward(double iTowardValue, double iIgnored, double iMaxToMove) {
        double newValue = Math.abs(iTowardValue - this.value) <= iMaxToMove ? iTowardValue : (iTowardValue > this.value ? this.value + iMaxToMove : this.value - iMaxToMove);
        this.dragTo(newValue, 0.0, false);
    }

    public final AffectedDescendents getAffectedDescendents() {
        return this.affected;
    }
}

