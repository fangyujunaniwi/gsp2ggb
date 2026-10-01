/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Colorizer;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.SimpleMeasure;
import java.awt.Color;

public class ColorizedGrayscale
extends Colorizer {
    SimpleMeasure univariate;

    public ColorizedGrayscale(GObject iMeasure, double iDomainLow, double iDomainHi, int boundaryCondition) {
        super(iDomainLow, iDomainHi, boundaryCondition);
        this.univariate = (SimpleMeasure)iMeasure;
    }

    public boolean applyColor(GObject image) {
        if (this.univariate.isDefined()) {
            float gray = (float)this.parameterizeAndClipToRange(this.univariate.value);
            image.setColor(new Color(gray, gray, gray));
            return true;
        }
        return false;
    }
}

