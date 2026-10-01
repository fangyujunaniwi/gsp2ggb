/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.MultiMeasure;
import com.keypress.Gobjects.gCoordSys;
import com.keypress.Gobjects.gPoint;
import java.awt.Font;

public class CoordinatePair
extends MultiMeasure {
    static final int x_EquFormComp = 1;
    static final int y_EquFormComp = 2;
    boolean isDisplayingPolar;

    public CoordinatePair(String Prefix, Font myFont, GObject[] myParents, int baseX, int baseY, boolean isPolar, int digitsOfPrecision) {
        super(Prefix, myFont, myParents, baseX, baseY, digitsOfPrecision);
        this.isDisplayingPolar = isPolar;
    }

    public double getDefinedEquFormComponent(int component) {
        gCoordSys c = (gCoordSys)this.getParent(1);
        switch (component) {
            case 1: 
            case 2: {
                gPoint p = (gPoint)this.getParent(0);
                if (component == 1) {
                    return (p.getX() - c.getOriginX()) / c.getUnitLengthX();
                }
                return -(p.getY() - c.getOriginY()) / c.getUnitLengthY();
            }
        }
        return -999.99;
    }

    protected void updateValue(boolean updateStringRep) {
        gPoint p = (gPoint)this.getParent(0);
        gCoordSys c = (gCoordSys)this.getParent(1);
        if (p.isExisting() && c.isExisting()) {
            this.existing = true;
            this.isDefined = true;
            if (updateStringRep) {
                this.valueStr = this.isDisplayingPolar ? "[KLOOGE]" : "(" + this.roundedDoubleString(this.getDefinedEquFormComponent(1)) + ", " + this.roundedDoubleString(this.getDefinedEquFormComponent(2)) + ")";
            }
        } else {
            this.existing = false;
        }
    }

    public boolean isEquFormComponentDefined(int component) {
        return true;
    }
}

