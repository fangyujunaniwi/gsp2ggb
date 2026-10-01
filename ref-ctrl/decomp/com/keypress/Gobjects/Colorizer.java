/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Transformer;
import com.keypress.Gobjects.doublePoint;

public abstract class Colorizer
extends Transformer {
    double domainMin;
    double domainMax;
    int boundaryBehavior;
    static final int _BoundaryBehavior_LimitToRange = 0;
    static final int _BoundaryBehavior_WrapToRange = 1;
    static final int _BoundaryBehavior_ReflectToRange = 2;

    public boolean imageIsColorized() {
        return true;
    }

    public Colorizer(double iDomainMin, double iDomainMax, int iBoundaryBehavior) {
        this.domainMin = iDomainMin;
        this.domainMax = iDomainMax;
        this.boundaryBehavior = iBoundaryBehavior;
    }

    public final double parameterizeAndClipToRange(double iDomain) {
        double parameter = (iDomain - this.domainMin) / (this.domainMax - this.domainMin);
        double multiple = Math.floor(parameter);
        parameter -= multiple;
        if (0 == this.boundaryBehavior) {
            if (multiple < 0.0) {
                parameter = 0.0;
            } else if (multiple > 0.0) {
                parameter = 1.0;
            }
            multiple = 0.0;
        }
        if (1L == (long)(multiple = Math.abs(multiple)) % 2L && 0.0 == parameter) {
            multiple -= 1.0;
            parameter = 1.0;
        }
        if (2 == this.boundaryBehavior && 1L == (long)multiple % 2L) {
            parameter = 1.0 - parameter;
        }
        if (parameter < 0.0) {
            parameter = 0.0;
        } else if (!(parameter <= 1.0)) {
            parameter = 1.0;
        }
        return parameter;
    }

    public final doublePoint imageXY(double preImageX, double preImageY) {
        this.image.x = preImageX;
        this.image.y = preImageY;
        return this.image;
    }

    public abstract boolean applyColor(GObject var1);

    public final boolean prepareTransformer(GObject image) {
        return this.applyColor(image);
    }
}

