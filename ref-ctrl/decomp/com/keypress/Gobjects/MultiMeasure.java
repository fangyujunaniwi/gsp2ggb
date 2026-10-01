/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gMeasure;
import java.awt.Font;

public abstract class MultiMeasure
extends gMeasure {
    public MultiMeasure(String Prefix, Font myFont, GObject[] myParents, int baseX, int baseY, int digitsOfPrecision) {
        super(Prefix, myFont, myParents.length, myParents, baseX, baseY, digitsOfPrecision);
    }

    abstract boolean isEquFormComponentDefined(int var1);

    abstract double getDefinedEquFormComponent(int var1);
}

