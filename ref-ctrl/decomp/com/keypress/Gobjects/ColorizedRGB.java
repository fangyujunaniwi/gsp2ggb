/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Colorizer;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.SimpleMeasure;
import java.awt.Color;

public class ColorizedRGB
extends Colorizer {
    SimpleMeasure rColor;
    SimpleMeasure gColor;
    SimpleMeasure bColor;

    public ColorizedRGB(GObject iMeasure3, GObject iMeasure2, GObject iMeasure1, double iDomainLow, double iDomainHi, int boundaryCondition) {
        super(iDomainLow, iDomainHi, boundaryCondition);
        this.rColor = (SimpleMeasure)iMeasure1;
        this.gColor = (SimpleMeasure)iMeasure2;
        this.bColor = (SimpleMeasure)iMeasure3;
    }

    public boolean applyColor(GObject image) {
        if (this.rColor.isDefined() && this.gColor.isDefined() && this.bColor.isDefined()) {
            image.setColor(new Color((float)this.parameterizeAndClipToRange(this.rColor.value), (float)this.parameterizeAndClipToRange(this.gColor.value), (float)this.parameterizeAndClipToRange(this.bColor.value)));
            return true;
        }
        return false;
    }
}

