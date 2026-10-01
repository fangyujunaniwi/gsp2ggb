/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Colorizer;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.SimpleMeasure;
import java.awt.Color;

public class ColorizedHSV
extends Colorizer {
    SimpleMeasure hColor;
    SimpleMeasure sColor;
    SimpleMeasure vColor;

    public ColorizedHSV(GObject iMeasure3, GObject iMeasure2, GObject iMeasure1, double iDomainLow, double iDomainHi, int boundaryCondition) {
        super(iDomainLow, iDomainHi, boundaryCondition);
        this.hColor = (SimpleMeasure)iMeasure1;
        this.sColor = (SimpleMeasure)iMeasure2;
        this.vColor = (SimpleMeasure)iMeasure3;
    }

    public boolean applyColor(GObject image) {
        if (this.hColor.isDefined() && this.sColor.isDefined() && this.vColor.isDefined()) {
            double r;
            double g;
            double b;
            double hue = this.parameterizeAndClipToRange(this.hColor.value);
            double sat = this.parameterizeAndClipToRange(this.sColor.value);
            double val = this.parameterizeAndClipToRange(this.vColor.value);
            if (sat == 0.0) {
                g = b = val;
                r = b;
            } else {
                int i = (int)Math.floor(hue /= 0.16666666666666666);
                double f = hue - Math.floor(hue);
                double p = val * (1.0 - sat);
                double q = val * (1.0 - sat * f);
                double t = val * (1.0 - sat * (1.0 - f));
                switch (i) {
                    case 0: {
                        r = val;
                        g = t;
                        b = p;
                        break;
                    }
                    case 1: {
                        r = q;
                        g = val;
                        b = p;
                        break;
                    }
                    case 2: {
                        r = p;
                        g = val;
                        b = t;
                        break;
                    }
                    case 3: {
                        r = p;
                        g = q;
                        b = val;
                        break;
                    }
                    case 4: {
                        r = t;
                        g = p;
                        b = val;
                        break;
                    }
                    default: {
                        r = val;
                        g = p;
                        b = q;
                    }
                }
            }
            image.setColor(new Color((float)r, (float)g, (float)b));
            return true;
        }
        return false;
    }
}

